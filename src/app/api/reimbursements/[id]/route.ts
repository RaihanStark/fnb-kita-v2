import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { ReimbursementService } from '@/lib/services/reimbursement.service';
import { z } from 'zod';

// Update status schema
const updateStatusSchema = z.object({
  status: z.enum(['approved', 'denied', 'paid']),
  managerComments: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reimbursement
    const reimbursement = await ReimbursementService.getById(params.id);

    if (!reimbursement) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
    }

    // Check authorization: employees can only view their own reimbursements
    if (tokenPayload.role === 'Employee' && reimbursement.employeeId !== tokenPayload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(reimbursement);
  } catch (error) {
    console.error('Error fetching reimbursement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reimbursement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers can update reimbursement status
    if (tokenPayload.role !== 'Manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const { status, managerComments } = updateStatusSchema.parse(body);

    // Update reimbursement status
    await ReimbursementService.updateStatus(
      params.id,
      status,
      tokenPayload.userId,
      managerComments
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating reimbursement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Reimbursement not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update reimbursement' },
      { status: 500 }
    );
  }
}