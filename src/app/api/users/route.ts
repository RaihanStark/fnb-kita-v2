import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and check if user is a Manager
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.role !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    // Get all users
    const listUsersResult = await adminAuth.listUsers(1000); // Firebase max is 1000
    
    // Filter users based on search and role
    const filteredUsers = listUsersResult.users.filter(user => {
      const matchesSearch = !search || 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(search.toLowerCase());
      
      const userRole = user.customClaims?.role || 'Employee';
      const matchesRole = !roleFilter || userRole === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort by email
    filteredUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Transform user data
    const users = paginatedUsers.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.customClaims?.role || 'Employee',
      lastLogin: user.metadata.lastSignInTime,
      createdAt: user.metadata.creationTime,
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}