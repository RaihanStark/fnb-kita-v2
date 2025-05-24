import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and check if user is a Manager
    const decodedToken = await getAuth(admin).verifyIdToken(token);
    
    if (decodedToken.role !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    // Prevent managers from changing their own role
    if (decodedToken.uid === params.userId) {
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
      const listUsersResult = await getAuth(admin).listUsers(1000);
      const managers = listUsersResult.users.filter(
        user => user.customClaims?.role === 'Manager' && user.uid !== params.userId
      );

      if (managers.length === 0) {
        return NextResponse.json(
          { error: 'Cannot change role: This would remove the last manager' },
          { status: 400 }
        );
      }
    }

    // Update the user's custom claims
    await getAuth(admin).setCustomUserClaims(params.userId, { role });

    // Get updated user data
    const updatedUser = await getAuth(admin).getUser(params.userId);

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