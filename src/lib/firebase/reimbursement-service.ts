import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { getAuth } from 'firebase/auth';

export interface Reimbursement {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  category: 'meal' | 'transport' | 'supplies' | 'other';
  description: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'denied' | 'paid';
  submittedDate: Date;
  processedDate?: Date;
  processedBy?: string;
  managerComments?: string;
  paidDate?: Date;
}

const REIMBURSEMENTS_COLLECTION = 'reimbursements';
const ITEMS_PER_PAGE = 10;

export async function createReimbursement(
  data: Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>
): Promise<string> {
  const docRef = await addDoc(collection(db, REIMBURSEMENTS_COLLECTION), {
    ...data,
    status: 'pending',
    submittedDate: Timestamp.now()
  });
  return docRef.id;
}

export async function getReimbursements(
  userRole: string,
  userId: string,
  filters?: {
    status?: string;
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  reimbursements: Reimbursement[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  let q = query(collection(db, REIMBURSEMENTS_COLLECTION));

  // Filter by user for employees
  if (userRole === 'Employee') {
    q = query(q, where('employeeId', '==', userId));
  }

  // Apply filters
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters?.employeeId && userRole === 'Manager') {
    q = query(q, where('employeeId', '==', filters.employeeId));
  }
  if (filters?.startDate) {
    q = query(q, where('submittedDate', '>=', Timestamp.fromDate(filters.startDate)));
  }
  if (filters?.endDate) {
    q = query(q, where('submittedDate', '<=', Timestamp.fromDate(filters.endDate)));
  }

  // Order and pagination
  q = query(q, orderBy('submittedDate', 'desc'), limit(ITEMS_PER_PAGE + 1));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const hasMore = docs.length > ITEMS_PER_PAGE;
  const reimbursementDocs = hasMore ? docs.slice(0, -1) : docs;

  const reimbursements = reimbursementDocs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      submittedDate: data.submittedDate?.toDate() || new Date(),
      processedDate: data.processedDate?.toDate(),
      paidDate: data.paidDate?.toDate()
    } as Reimbursement;
  });

  return {
    reimbursements,
    lastDoc: reimbursementDocs[reimbursementDocs.length - 1] || null,
    hasMore
  };
}

export async function getReimbursement(id: string): Promise<Reimbursement | null> {
  const docRef = doc(db, REIMBURSEMENTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    submittedDate: data.submittedDate?.toDate() || new Date(),
    processedDate: data.processedDate?.toDate(),
    paidDate: data.paidDate?.toDate()
  } as Reimbursement;
}

export async function updateReimbursementStatus(
  id: string,
  status: 'approved' | 'denied' | 'paid',
  managerId: string,
  managerComments?: string
): Promise<void> {
  const docRef = doc(db, REIMBURSEMENTS_COLLECTION, id);
  const updateData: any = {
    status,
    processedBy: managerId,
    processedDate: Timestamp.now()
  };

  if (managerComments) {
    updateData.managerComments = managerComments;
  }

  if (status === 'paid') {
    updateData.paidDate = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

export async function uploadReceipt(
  reimbursementId: string,
  file: File
): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const storageRef = ref(storage, `receipts/${reimbursementId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  // Update reimbursement with receipt URL
  const docRef = doc(db, REIMBURSEMENTS_COLLECTION, reimbursementId);
  await updateDoc(docRef, {
    receiptUrl: downloadUrl
  });

  return downloadUrl;
}

export async function getReimbursementStats(userId?: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  denied: number;
  paid: number;
  totalAmount: number;
  paidAmount: number;
}> {
  let q = query(collection(db, REIMBURSEMENTS_COLLECTION));
  
  if (userId) {
    q = query(q, where('employeeId', '==', userId));
  }

  const snapshot = await getDocs(q);
  
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    paid: 0,
    totalAmount: 0,
    paidAmount: 0
  };

  snapshot.forEach((doc) => {
    const data = doc.data();
    stats.total++;
    stats[data.status]++;
    stats.totalAmount += data.amount || 0;
    if (data.status === 'paid') {
      stats.paidAmount += data.amount || 0;
    }
  });

  return stats;
}