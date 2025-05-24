import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { setUserRole, UserRole } from '@/lib/firebase/auth-service'

// TEST ENDPOINT ONLY - DO NOT USE IN PRODUCTION
// Example: POST /api/test-set-role?email=user@example.com&role=Manager
export async function POST(request: NextRequest) {
  try {
    // Get search params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const role = searchParams.get('role')

    // Validate inputs
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    if (!role || !['Manager', 'Employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role parameter is required (Manager or Employee)' },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found with the provided email' },
        { status: 404 }
      )
    }

    // Set the user role
    const success = await setUserRole(user.uid, role as UserRole)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Role '${role}' set successfully for user ${email}`,
      uid: user.uid,
      email: user.email,
      role: role
    })

  } catch (error) {
    console.error('Error setting user role:', error)
    
    if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found with the provided email' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing in browser
export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint for setting user roles',
    usage: 'POST /api/test-set-role?email=user@example.com&role=Manager',
    availableRoles: ['Manager', 'Employee'],
    warning: 'This is a TEST endpoint only. Do not use in production!'
  })
}