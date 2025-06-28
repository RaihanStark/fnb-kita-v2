import { getDb } from '@/lib/db';
import { users, invitations, type User, type NewUser } from '@/lib/db/schema';
import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  // Get all users with pagination and filters
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'Manager' | 'Employee';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (params.search) {
      whereConditions.push(
        or(
          ilike(users.email, `%${params.search}%`),
          ilike(users.nama, `%${params.search}%`),
          ilike(users.posisi, `%${params.search}%`)
        )
      );
    }

    if (params.role) {
      whereConditions.push(eq(users.role, params.role));
    }

    // Get users
    const [usersList, totalCount] = await Promise.all([
      db.query.users.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit,
        offset,
        orderBy: [desc(users.createdAt)],
      }),
      db.select({ count: users.id }).from(users).where(
        whereConditions.length > 0 ? and(...whereConditions) : undefined
      ),
    ]);

    return {
      users: usersList,
      totalCount: totalCount.length,
      totalPages: Math.ceil(totalCount.length / limit),
      currentPage: page,
    };
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return user || null;
  }

  // Update user
  static async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  // Update user role
  static async updateUserRole(userId: string, role: 'Manager' | 'Employee'): Promise<void> {
    await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Create invitation
  static async createInvitation(data: {
    email: string;
    nama: string;
    role: 'Manager' | 'Employee';
    invitedById: string;
  }) {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check for existing invitation
    const existingInvitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.email, data.email),
        eq(invitations.usedAt, null)
      ),
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new Error('An active invitation already exists for this email');
    }

    // Create invitation
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const [invitation] = await getDb().insert(invitations).values({
      token,
      email: data.email,
      nama: data.nama,
      role: data.role,
      invitedById: data.invitedById,
      expiresAt,
    }).returning();

    return invitation;
  }

  // Verify invitation
  static async verifyInvitation(token: string) {
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      throw new Error('Invalid invitation');
    }

    if (invitation.usedAt) {
      throw new Error('Invitation has already been used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    return invitation;
  }

  // Accept invitation
  static async acceptInvitation(token: string, password: string) {
    // Verify invitation
    const invitation = await this.verifyInvitation(token);

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: invitation.email,
      passwordHash,
      nama: invitation.nama,
      displayName: invitation.nama,
      role: invitation.role,
      registrationStatus: 'registered',
    }).returning();

    // Mark invitation as used
    await db.update(invitations)
      .set({ usedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    return newUser;
  }

  // Update reimbursement limits
  static async updateReimbursementLimits(userId: string, limits: Record<string, { limit: number; digunakan: number }>) {
    await db.update(users)
      .set({
        limitReimbursement: limits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Reset monthly reimbursement usage
  static async resetMonthlyUsage() {
    const allUsers = await db.query.users.findMany({
      where: eq(users.status, 'active'),
    });

    for (const user of allUsers) {
      if (user.limitReimbursement) {
        const resetLimits = Object.entries(user.limitReimbursement).reduce((acc, [category, data]) => ({
          ...acc,
          [category]: { ...data, digunakan: 0 },
        }), {});

        await db.update(users)
          .set({
            limitReimbursement: resetLimits,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    }
  }
}