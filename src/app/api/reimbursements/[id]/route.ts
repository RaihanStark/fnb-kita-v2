import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'Employee';

    const doc = await getAdminDb().collection('reimbursements').doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
    }

    const data = doc.data()!;

    // Check authorization: employees can only view their own reimbursements
    if (userRole === 'Employee' && data.employeeId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: doc.id,
      ...data,
      submittedDate: data.submittedDate?.toDate?.() || new Date(),
      processedDate: data.processedDate?.toDate?.(),
      paidDate: data.paidDate?.toDate?.()
    });
  } catch (error) {
    console.error('Error fetching reimbursement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reimbursement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'Employee';

    // Only managers can update reimbursement status
    if (userRole !== 'Manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { status, managerComments } = body;

    // Validate status
    if (!status || !['approved', 'denied', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if reimbursement exists
    const docRef = getAdminDb().collection('reimbursements').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
    }

    const currentData = doc.data()!;

    // Validate status transitions
    if (status === 'paid' && currentData.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only mark approved reimbursements as paid' },
        { status: 400 }
      );
    }

    // Handle personal expense limit adjustments when denying
    if (status === 'denied' && currentData.expenseType === 'personal' && currentData.status === 'pending') {
      const userDoc = await getAdminDb().collection('users').doc(currentData.employeeId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const limitReimbursement = userData?.limitReimbursement || {};
        
        if (limitReimbursement[currentData.category]) {
          const categoryLimit = limitReimbursement[currentData.category];
          const currentUsage = categoryLimit.usage || 0;
          const reimbursementAmount = currentData.amount || 0;
          
          // Subtract the amount from usage since it was denied
          const newUsage = Math.max(0, currentUsage - reimbursementAmount);
          limitReimbursement[currentData.category] = {
            ...categoryLimit,
            usage: newUsage
          };

          // Update user document
          await getAdminDb().collection('users').doc(currentData.employeeId).update({
            limitReimbursement
          });
        }
      }
    }

    // Update reimbursement
    const updateData: Record<string, any> = {
      status,
      processedBy: userId,
      processedDate: Timestamp.now()
    };

    if (managerComments) {
      updateData.managerComments = managerComments;
    }

    if (status === 'paid') {
      updateData.paidDate = Timestamp.now();
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reimbursement:', error);
    return NextResponse.json(
      { error: 'Failed to update reimbursement' },
      { status: 500 }
    );
  }
}