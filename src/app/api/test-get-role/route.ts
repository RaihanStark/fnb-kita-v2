import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getUserRole } from '@/lib/firebase/auth-service'

// TEST ENDPOINT ONLY - DO NOT USE IN PRODUCTION
// Example: GET /api/test-get-role?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    // Get search params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    // Validate inputs
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
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

    // Get the user role
    const role = await getUserRole(user.uid)

    return NextResponse.json({
      success: true,
      uid: user.uid,
      email: user.email,
      role: role || 'No role assigned',
      customClaims: user.customClaims || {}
    })

  } catch (error) {
    console.error('Error getting user role:', error)
    
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