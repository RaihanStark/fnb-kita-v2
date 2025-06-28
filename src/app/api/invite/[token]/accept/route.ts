import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { AuthService } from '@/lib/services/auth.service';
import { z } from 'zod';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from '@/lib/auth/config';

const acceptInvitationSchema = z.object({
  password: z.string().min(6),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
    }

    // Validate input
    const { password } = acceptInvitationSchema.parse(body);

    // Accept invitation and create user
    const newUser = await UserService.acceptInvitation(token, password);

    // Generate tokens for automatic login
    const { accessToken, refreshToken } = await AuthService.login(newUser.email, password);

    // Create response
    const response = NextResponse.json({ 
      message: 'Registration completed successfully',
      user: newUser,
    });

    // Set cookies for automatic login
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Invalid invitation' || 
        error.message === 'Invitation has already been used' ||
        error.message === 'Invitation has expired') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}