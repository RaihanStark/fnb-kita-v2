import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and check if user is a Manager
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    if (decodedToken.role !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    // Prevent managers from changing their own role
    if (decodedToken.uid === userId) {
      return NextResponse.json({ error: 'Managers cannot change their own role' }, { status: 400 });
    }

    // Get the new role from request body
    const body = await request.json();
    const { role } = body;

    if (!role || !['Manager', 'Employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be Manager or Employee' }, { status: 400 });
    }

    // Check if this would remove the last manager
    if (role === 'Employee') {
      const listUsersResult = await getAdminAuth().listUsers(1000);
      const managers = listUsersResult.users.filter(
        user => user.customClaims?.role === 'Manager' && user.uid !== userId
      );

      if (managers.length === 0) {
        return NextResponse.json(
          { error: 'Cannot change role: This would remove the last manager' },
          { status: 400 }
        );
      }
    }

    // Update the user's custom claims
    await getAdminAuth().setCustomUserClaims(userId, { role });

    // Get updated user data
    const updatedUser = await getAdminAuth().getUser(userId);

    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.customClaims?.role || 'Employee',
        lastLogin: updatedUser.metadata.lastSignInTime,
        createdAt: updatedUser.metadata.creationTime,
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}