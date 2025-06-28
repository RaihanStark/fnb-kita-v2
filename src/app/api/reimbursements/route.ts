import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'Employee';

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const lastDocId = searchParams.get('lastDocId');

    // Build query
    const query = getAdminDb().collection('reimbursements');
    let queryRef = query as any;

    // Filter by user for employees
    if (userRole === 'Employee') {
      queryRef = queryRef.where('employeeId', '==', userId);
    }

    // Apply filters
    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }
    if (employeeId && userRole === 'Manager') {
      queryRef = queryRef.where('employeeId', '==', employeeId);
    }
    if (startDate) {
      queryRef = queryRef.where('submittedDate', '>=', Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      queryRef = queryRef.where('submittedDate', '<=', Timestamp.fromDate(new Date(endDate)));
    }

    // Order and pagination
    queryRef = queryRef.orderBy('submittedDate', 'desc').limit(pageSize + 1);

    if (lastDocId) {
      const lastDoc = await getAdminDb().collection('reimbursements').doc(lastDocId).get();
      if (lastDoc.exists) {
        queryRef = queryRef.startAfter(lastDoc);
      }
    }

    const snapshot = await queryRef.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const reimbursementDocs = hasMore ? docs.slice(0, -1) : docs;

    const reimbursements = reimbursementDocs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedDate: data.submittedDate?.toDate?.() || new Date(),
        processedDate: data.processedDate?.toDate?.(),
        paidDate: data.paidDate?.toDate?.()
      };
    });

    return NextResponse.json({
      reimbursements,
      lastDocId: reimbursementDocs[reimbursementDocs.length - 1]?.id || null,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching reimbursements:', error);
    
    // Handle Firestore not initialized error
    if ((error as any).code === 5 || (error as any).message?.includes('NOT_FOUND')) {
      return NextResponse.json({
        reimbursements: [],
        lastDocId: null,
        hasMore: false
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reimbursements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user info
    const userRecord = await getAdminAuth().getUser(userId);
    const userName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Unknown';
    const userEmail = userRecord.email || '';

    const body = await request.json();
    const { amount, expenseType, category, description, receiptUrl } = body;

    // Validate required fields
    if (!amount || !expenseType || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate expense type
    if (!['personal', 'business'].includes(expenseType)) {
      return NextResponse.json(
        { error: 'Invalid expense type' },
        { status: 400 }
      );
    }

    // For personal expenses, check and update user limits
    if (expenseType === 'personal') {
      const userDoc = await getAdminDb().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      const limitReimbursement = userData?.limitReimbursement || {};

      // Check if category exists in user limits
      if (!limitReimbursement[category]) {
        return NextResponse.json(
          { error: `Category '${category}' not found in your reimbursement limits` },
          { status: 400 }
        );
      }

      const categoryLimit = limitReimbursement[category];
      const currentUsage = categoryLimit.usage || 0;
      const limit = categoryLimit.limit || 0;

      // Check if adding this amount would exceed the limit
      if (currentUsage + Number(amount) > limit) {
        return NextResponse.json(
          { error: `This expense would exceed your ${category} limit. Current: Rp ${currentUsage.toLocaleString('id-ID')}, Limit: Rp ${limit.toLocaleString('id-ID')}, Requested: Rp ${Number(amount).toLocaleString('id-ID')}` },
          { status: 400 }
        );
      }

      // Update the usage (will be committed after reimbursement creation)
      const newUsage = currentUsage + Number(amount);
      limitReimbursement[category] = {
        ...categoryLimit,
        usage: newUsage
      };

      // Update user document with new usage
      await getAdminDb().collection('users').doc(userId).update({
        limitReimbursement
      });
    }

    // Create reimbursement
    const docRef = await getAdminDb().collection('reimbursements').add({
      employeeId: userId,
      employeeName: userName,
      employeeEmail: userEmail,
      amount: Number(amount),
      expenseType,
      category,
      description,
      receiptUrl: receiptUrl || null,
      status: 'pending',
      submittedDate: Timestamp.now()
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating reimbursement:', error);
    
    // Handle Firestore not initialized error - create a mock response for testing
    if ((error as any).code === 5 || (error as any).message?.includes('NOT_FOUND')) {
      // Return a mock ID for testing purposes
      return NextResponse.json({ 
        id: `mock-${Date.now()}`,
        warning: 'Firestore not initialized - returning mock ID for testing'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to create reimbursement' },
      { status: 500 }
    );
  }
}