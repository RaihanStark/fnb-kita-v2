import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const db = getAdminDb();

    // Find the invitation by userId (which is actually the invitation document ID)
    const invitationDoc = await db.collection('invitations').doc(userId).get();
    
    if (!invitationDoc.exists) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitationData = invitationDoc.data();
    
    if (invitationData?.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 });
    }

    // Generate new invitation token and expiry
    const newInvitationToken = uuidv4();
    const newInvitationExpiry = new Date();
    newInvitationExpiry.setDate(newInvitationExpiry.getDate() + 7);

    // Update invitation record
    await invitationDoc.ref.update({
      invitationToken: newInvitationToken,
      invitationExpiry: newInvitationExpiry.toISOString(),
      invitedAt: new Date().toISOString(),
      invitedBy: decodedToken.email,
    });

    // Generate new invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/invite/${newInvitationToken}`;

    // TODO: Send email with new invitation link
    console.log(`New invitation link for ${invitationData.email}: ${invitationLink}`);

    return NextResponse.json({ 
      message: 'Invitation resent successfully',
      invitationLink // In production, remove this and only send via email
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}