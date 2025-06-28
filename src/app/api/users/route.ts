import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { UserService } from '@/lib/services/user.service';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as 'Manager' | 'Employee' | undefined;

    // Get users with filters
    const result = await UserService.getUsers({
      page,
      limit,
      search: search || undefined,
      role: role || undefined,
    });

    return NextResponse.json({
      users: result.users,
      pagination: {
        page: result.currentPage,
        limit,
        total: result.totalCount,
        totalPages: result.totalPages,
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