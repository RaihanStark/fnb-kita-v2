import { getDb } from '@/lib/db';
import { users, sessions, type User, type NewUser } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  // Register a new user
  static async register(data: {
    email: string;
    password: string;
    nama: string;
    role?: 'Manager' | 'Employee';
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const db = getDb();
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const [newUser] = await getDb().insert(users).values({
      email: data.email,
      passwordHash,
      nama: data.nama,
      displayName: data.nama,
      role: data.role || 'Employee',
    }).returning();

    // Generate tokens
    const { accessToken, refreshToken } = await this.createSession(newUser);

    return { user: newUser, accessToken, refreshToken };
  }

  // Login user
  static async login(email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.createSession(user);

    return { user, accessToken, refreshToken };
  }

  // Create session and generate tokens
  private static async createSession(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const sessionId = uuidv4();
    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await getDb().insert(sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find session
    const db = getDb();
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.refreshToken, refreshToken),
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user
    const user = await getDb().query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    // Delete old session
    await getDb().delete(sessions).where(eq(sessions.id, session.id));

    // Create new session
    const tokens = await this.createSession(user);
    return tokens;
  }

  // Logout
  static async logout(refreshToken: string): Promise<void> {
    await getDb().delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }

  // Change password
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Find user
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db.update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate all sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return user || null;
  }
}