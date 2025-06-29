import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Get new tokens
    const tokens = await AuthService.refreshToken(refreshToken);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
    });

    // Set new cookies
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    
    // Clear cookies on error
    const response = NextResponse.json(
      { error: error.message || 'Invalid refresh token' },
      { status: 401 }
    );

    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);

    return response;
  }
}