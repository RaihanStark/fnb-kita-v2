import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { UserService } from '@/lib/services/user.service';
import { z } from 'zod';

const roleSchema = z.object({
  role: z.enum(['Manager', 'Employee']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  
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

    // Prevent managers from changing their own role
    if (tokenPayload.userId === userId) {
      return NextResponse.json({ error: 'Managers cannot change their own role' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { role } = roleSchema.parse(body);

    // Update user role
    await UserService.updateUserRole(userId, role);

    // Get updated user
    const updatedUser = await UserService.getUserById(userId);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}