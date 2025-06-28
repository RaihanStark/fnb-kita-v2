import { getDb } from '@/lib/db';
import { reimbursements, users, type Reimbursement, type NewReimbursement } from '@/lib/db/schema';
import { eq, and, or, gte, lte, desc, ilike } from 'drizzle-orm';
import { UserService } from './user.service';

export class ReimbursementService {
  // Create reimbursement
  static async create(data: {
    employeeId: string;
    employeeName: string;
    amount: number;
    expenseType: 'personal' | 'business';
    category: string;
    description: string;
    receiptUrl?: string;
  }): Promise<Reimbursement> {
    // If personal expense, validate against limits
    if (data.expenseType === 'personal') {
      const user = await UserService.getUserById(data.employeeId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.limitReimbursement && user.limitReimbursement[data.category]) {
        const categoryLimit = user.limitReimbursement[data.category];
        const newUsage = categoryLimit.digunakan + data.amount;
        
        if (newUsage > categoryLimit.limit) {
          throw new Error(`Exceeds limit for ${data.category}. Available: ${categoryLimit.limit - categoryLimit.digunakan}`);
        }

        // Update usage
        const updatedLimits = {
          ...user.limitReimbursement,
          [data.category]: {
            ...categoryLimit,
            digunakan: newUsage,
          },
        };

        await UserService.updateReimbursementLimits(data.employeeId, updatedLimits);
      }
    }

    // Create reimbursement
    const db = getDb();
    const [reimbursement] = await db.insert(reimbursements).values(data).returning();
    return reimbursement;
  }

  // Get reimbursements with filters
  static async getReimbursements(params: {
    userId?: string;
    role?: string;
    status?: string;
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    // If employee, only show their own reimbursements
    if (params.role === 'Employee' && params.userId) {
      whereConditions.push(eq(reimbursements.employeeId, params.userId));
    }

    if (params.status) {
      whereConditions.push(eq(reimbursements.status, params.status as any));
    }

    if (params.employeeId && params.role === 'Manager') {
      whereConditions.push(eq(reimbursements.employeeId, params.employeeId));
    }

    if (params.startDate) {
      whereConditions.push(gte(reimbursements.submittedDate, params.startDate));
    }

    if (params.endDate) {
      whereConditions.push(lte(reimbursements.submittedDate, params.endDate));
    }

    // Get reimbursements
    const db = getDb();
    const [list, totalCount] = await Promise.all([
      db.query.reimbursements.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit,
        offset,
        orderBy: [desc(reimbursements.submittedDate)],
      }),
      db.select({ count: reimbursements.id }).from(reimbursements).where(
        whereConditions.length > 0 ? and(...whereConditions) : undefined
      ),
    ]);

    return {
      reimbursements: list,
      totalCount: totalCount.length,
      totalPages: Math.ceil(totalCount.length / limit),
      currentPage: page,
      hasMore: page < Math.ceil(totalCount.length / limit),
    };
  }

  // Get reimbursement by ID
  static async getById(id: string): Promise<Reimbursement | null> {
    const db = getDb();
    const reimbursement = await db.query.reimbursements.findFirst({
      where: eq(reimbursements.id, id),
    });

    return reimbursement || null;
  }

  // Update reimbursement status
  static async updateStatus(
    id: string,
    status: 'approved' | 'denied' | 'paid',
    managerId: string,
    managerComments?: string
  ): Promise<Reimbursement> {
    // Get current reimbursement
    const current = await this.getById(id);
    if (!current) {
      throw new Error('Reimbursement not found');
    }

    // If denying a personal expense, revert the usage
    if (status === 'denied' && current.expenseType === 'personal') {
      const user = await UserService.getUserById(current.employeeId);
      if (user && user.limitReimbursement && user.limitReimbursement[current.category]) {
        const categoryLimit = user.limitReimbursement[current.category];
        const revertedUsage = Math.max(0, categoryLimit.digunakan - Number(current.amount));
        
        const updatedLimits = {
          ...user.limitReimbursement,
          [current.category]: {
            ...categoryLimit,
            digunakan: revertedUsage,
          },
        };

        await UserService.updateReimbursementLimits(current.employeeId, updatedLimits);
      }
    }

    // Update reimbursement
    const db = getDb();
    const [updated] = await db.update(reimbursements)
      .set({
        status,
        managerId,
        managerComments,
        managerActionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, id))
      .returning();

    return updated;
  }

  // Get reimbursement statistics
  static async getStats(userId?: string, role?: string) {
    const whereConditions = [];
    
    if (role === 'Employee' && userId) {
      whereConditions.push(eq(reimbursements.employeeId, userId));
    }

    const db = getDb();
    const list = await db.query.reimbursements.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    });

    const stats = {
      total: list.length,
      pending: list.filter(r => r.status === 'pending').length,
      approved: list.filter(r => r.status === 'approved').length,
      denied: list.filter(r => r.status === 'denied').length,
      paid: list.filter(r => r.status === 'paid').length,
      totalAmount: list.reduce((sum, r) => sum + Number(r.amount), 0),
      paidAmount: list.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0),
    };

    return stats;
  }

  // Update receipt URL
  static async updateReceiptUrl(id: string, receiptUrl: string): Promise<void> {
    const db = getDb();
    await db.update(reimbursements)
      .set({ receiptUrl, updatedAt: new Date() })
      .where(eq(reimbursements.id, id));
  }
}