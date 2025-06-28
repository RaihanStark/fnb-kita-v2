import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
    }

    // Verify invitation
    const invitation = await UserService.verifyInvitation(token);

    // Return invitation data
    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        nama: invitation.nama,
        invitedById: invitation.invitedById,
        invitedAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      }
    });

  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    
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