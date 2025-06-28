import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Find invitation by token
    const invitationsRef = db.collection('invitations');
    const invitationQuery = await invitationsRef.where('invitationToken', '==', token).get();

    if (invitationQuery.empty) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitationDoc = invitationQuery.docs[0];
    const invitationData = invitationDoc.data();

    // Check if invitation is still pending
    if (invitationData.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 });
    }

    // Check if invitation has expired
    const expiryDate = new Date(invitationData.invitationExpiry);
    const now = new Date();

    if (now > expiryDate) {
      // Update status to expired
      await invitationDoc.ref.update({
        status: 'expired',
        expiredAt: now.toISOString(),
      });
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Return invitation data
    return NextResponse.json({
      invitation: {
        email: invitationData.email,
        role: invitationData.role,
        fullName: invitationData.fullName,
        invitedBy: invitationData.invitedBy,
        invitedAt: invitationData.invitedAt,
        expired: false,
      }
    });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}