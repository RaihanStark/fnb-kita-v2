import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { ReimbursementService } from '@/lib/services/reimbursement.service';
import { z } from 'zod';

// GET schema
const getReimbursementsSchema = z.object({
  status: z.string().optional(),
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// POST schema
const createReimbursementSchema = z.object({
  amount: z.number().positive(),
  expenseType: z.enum(['personal', 'business']),
  category: z.string().min(1),
  description: z.string().min(1),
  receiptUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = getReimbursementsSchema.parse({
      status: searchParams.get('status') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    // Get reimbursements with filters
    const result = await ReimbursementService.getReimbursements({
      userId: tokenPayload.userId,
      role: tokenPayload.role,
      status: params.status,
      employeeId: params.employeeId,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      page: parseInt(params.page || '1'),
      limit: parseInt(params.limit || '10'),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching reimbursements:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reimbursements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const data = createReimbursementSchema.parse(body);

    // Get user details for employee name
    const { UserService } = await import('@/lib/services/user.service');
    const user = await UserService.getUserById(tokenPayload.userId);
    const employeeName = user?.nama || user?.displayName || tokenPayload.email.split('@')[0];

    // Create reimbursement
    const reimbursement = await ReimbursementService.create({
      employeeId: tokenPayload.userId,
      employeeName,
      amount: data.amount,
      expenseType: data.expenseType,
      category: data.category,
      description: data.description,
      receiptUrl: data.receiptUrl,
    });

    return NextResponse.json({ 
      id: reimbursement.id,
      reimbursement,
    });
  } catch (error: any) {
    console.error('Error creating reimbursement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes('Exceeds limit')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create reimbursement' },
      { status: 500 }
    );
  }
}