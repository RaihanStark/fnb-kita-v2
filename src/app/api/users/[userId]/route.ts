import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(
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

    // Get user from Firebase Auth
    const userRecord = await getAdminAuth().getUser(userId);
    
    // Get additional user details from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Combine auth data with Firestore data
    const user = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims?.role || 'Employee',
      lastLogin: userRecord.metadata.lastSignInTime,
      createdAt: userRecord.metadata.creationTime,
      // Additional user details from Firestore
      nama: userData.nama || '',
      kontak: userData.kontak || '',
      posisi: userData.posisi || '',
      gaji: userData.gaji || { amount: 0, frequency: 'monthly', perBulan: 0, perMinggu: 0, perHari: 0 },
      status: userData.status || 'active',
      limitReimbursement: userData.limitReimbursement || {
        internet: 0,
        transport: 0,
        makan: 0,
        lainnya: 0,
      },
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const updates = await request.json();

    // Validate the updates
    const allowedFields = [
      'nama', 'kontak', 'posisi', 'gaji', 'status', 'limitReimbursement'
    ];
    
    const filteredUpdates: Record<string, unknown> = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Update user details in Firestore
    const db = getAdminDb();
    await db.collection('users').doc(userId).set(filteredUpdates, { merge: true });

    // Get updated user data
    const userRecord = await getAdminAuth().getUser(userId);
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const user = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims?.role || 'Employee',
      lastLogin: userRecord.metadata.lastSignInTime,
      createdAt: userRecord.metadata.creationTime,
      nama: userData.nama || '',
      kontak: userData.kontak || '',
      posisi: userData.posisi || '',
      gaji: userData.gaji || { amount: 0, frequency: 'monthly', perBulan: 0, perMinggu: 0, perHari: 0 },
      status: userData.status || 'active',
      limitReimbursement: userData.limitReimbursement || {
        internet: 0,
        transport: 0,
        makan: 0,
        lainnya: 0,
      },
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}