import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    // Get all registered users
    const listUsersResult = await getAdminAuth().listUsers(1000); // Firebase max is 1000
    
    // Get pending invitations
    const db = getAdminDb();
    const pendingInvitations = await db.collection('invitations')
      .where('status', '==', 'pending')
      .get();

    // Combine registered users and pending invitations
    const allUsers: any[] = [];

    // Add registered users
    listUsersResult.users.forEach(user => {
      allUsers.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.customClaims?.role || 'Employee',
        lastLogin: user.metadata.lastSignInTime,
        createdAt: user.metadata.creationTime,
        registered: 'registered',
      });
    });

    // Add pending invitations
    pendingInvitations.docs.forEach(doc => {
      const invitationData = doc.data();
      // Check if invitation hasn't expired
      const expiryDate = new Date(invitationData.invitationExpiry);
      const now = new Date();
      
      if (now <= expiryDate) {
        allUsers.push({
          uid: doc.id, // Use invitation doc ID as uid
          email: invitationData.email,
          displayName: null,
          role: invitationData.role,
          lastLogin: null,
          createdAt: invitationData.invitedAt,
          registered: 'invited',
          invitationToken: invitationData.invitationToken,
          invitationExpiry: invitationData.invitationExpiry,
          invitedAt: invitationData.invitedAt,
          invitedBy: invitationData.invitedBy,
        });
      }
    });
    
    // Filter users based on search and role
    const filteredUsers = allUsers.filter(user => {
      const matchesSearch = !search || 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = !roleFilter || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort by email
    filteredUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Users are already transformed above
    const users = paginatedUsers;

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