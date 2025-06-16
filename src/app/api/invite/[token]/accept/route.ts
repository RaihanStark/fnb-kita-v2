import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = getAdminDb();
    const adminAuth = getAdminAuth();
    
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
      await invitationDoc.ref.update({
        status: 'expired',
        expiredAt: now.toISOString(),
      });
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user already exists (shouldn't happen, but let's be safe)
    try {
      const existingUser = await adminAuth.getUserByEmail(invitationData.email);
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase user using the full name from invitation
    const userRecord = await adminAuth.createUser({
      email: invitationData.email,
      password,
      displayName: invitationData.fullName,
      emailVerified: true, // Since they're invited, we trust the email
    });

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: invitationData.role
    });

    // Create user document in Firestore with default values using full name from invitation
    const userData = {
      nama: invitationData.fullName,
      kontak: '',
      posisi: '',
      gaji: {
        amount: 0,
        frequency: 'monthly',
        perBulan: 0,
        perMinggu: 0,
        perHari: 0
      },
      status: 'active',
      limitReimbursement: {
        internet: { limit: 0, usage: 0, lastReset: new Date().toISOString() },
        transport: { limit: 0, usage: 0, lastReset: new Date().toISOString() },
        makan: { limit: 0, usage: 0, lastReset: new Date().toISOString() },
        lainnya: { limit: 0, usage: 0, lastReset: new Date().toISOString() },
      },
      registered: 'registered',
      registeredAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Update invitation status
    await invitationDoc.ref.update({
      status: 'accepted',
      acceptedAt: now.toISOString(),
      userId: userRecord.uid,
    });

    return NextResponse.json({ 
      message: 'Registration completed successfully',
      userId: userRecord.uid
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}