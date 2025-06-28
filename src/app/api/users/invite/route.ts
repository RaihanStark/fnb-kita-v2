import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
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

    const { email, role, fullName } = await request.json();

    // Validate input
    if (!email || !role || !fullName) {
      return NextResponse.json({ error: 'Email, role, and full name are required' }, { status: 400 });
    }

    if (!['Manager', 'Employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const adminAuth = getAdminAuth();
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Check if there's already a pending invitation
    const db = getAdminDb();
    const invitationsRef = db.collection('invitations');
    const existingInvitation = await invitationsRef.where('email', '==', email).get();
    
    if (!existingInvitation.empty) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 409 });
    }

    // Generate invitation token and expiry (7 days)
    const invitationToken = uuidv4();
    const invitationExpiry = new Date();
    invitationExpiry.setDate(invitationExpiry.getDate() + 7);

    // Create invitation record in Firestore
    const invitationData = {
      email,
      role,
      fullName,
      invitationToken,
      invitationExpiry: invitationExpiry.toISOString(),
      invitedAt: new Date().toISOString(),
      invitedBy: decodedToken.email,
      status: 'pending',
    };

    await invitationsRef.add(invitationData);

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/invite/${invitationToken}`;

    // TODO: Send email with invitation link
    // For now, we'll just return the link
    console.log(`Invitation link for ${email}: ${invitationLink}`);

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitationLink // In production, remove this and only send via email
    });

  } catch (error) {
    console.error('Error inviting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}