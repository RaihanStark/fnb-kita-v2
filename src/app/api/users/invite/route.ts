import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/middleware';
import { UserService } from '@/lib/services/user.service';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Manager', 'Employee']),
  nama: z.string().min(1),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate input
    const { email, role, nama } = inviteSchema.parse(body);

    // Create invitation
    const invitation = await UserService.createInvitation({
      email,
      nama,
      role,
      invitedById: tokenPayload.userId,
    });

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/invite/${invitation.token}`;

    // TODO: Send email with invitation link
    // For now, we'll just return the link
    console.log(`Invitation link for ${email}: ${invitationLink}`);

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitationLink, // In production, remove this and only send via email
      invitation,
    });

  } catch (error: any) {
    console.error('Error inviting employee:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'User with this email already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error.message === 'An active invitation already exists for this email') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}