import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { UserService } from '@/lib/services/user.service';
import { z } from 'zod';

// Update schema
const updateUserSchema = z.object({
  nama: z.string().optional(),
  kontak: z.string().optional(),
  posisi: z.string().optional(),
  gaji: z.object({
    amount: z.number(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    perBulan: z.number(),
    perMinggu: z.number(),
    perHari: z.number(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  limitReimbursement: z.record(z.object({
    limit: z.number(),
    digunakan: z.number(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a Manager
    if (tokenPayload.role !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { userId } = params;

    // Get user details
    const user = await UserService.getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate user
    const tokenPayload = await authenticateUser(request);
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a Manager
    if (tokenPayload.role !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();

    // Validate input
    const updates = updateUserSchema.parse(body);

    // Update user
    const updatedUser = await UserService.updateUser(userId, updates);

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user details:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}