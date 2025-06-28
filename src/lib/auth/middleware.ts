import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import { ACCESS_TOKEN_COOKIE } from './config';
import type { TokenPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

// Verify user is authenticated
export async function authenticateUser(request: NextRequest): Promise<TokenPayload | null> {
  try {
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

// Middleware to protect API routes
export function withAuth(
  handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

// Middleware to protect Manager-only routes
export function withManagerAuth(
  handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Forbidden: Manager access required' },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}