import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;
let adminStorage: any = null;

export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    adminApp = initializeApp(firebaseAdminConfig);
  }
  
  return adminApp;
}

export function getAdminAuth() {
  if (adminAuth) {
    return adminAuth;
  }
  
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export function getAdminDb() {
  if (adminDb) {
    return adminDb;
  }
  
  adminDb = getFirestore(getAdminApp());
  adminDb.settings({ databaseId: 'dbv2' });
  return adminDb;
}

export function getAdminStorage() {
  if (adminStorage) {
    return adminStorage;
  }
  
  adminStorage = getStorage(getAdminApp());
  return adminStorage;
}

// Export instances for backward compatibility
export { getAdminAuth as adminAuth, getAdminDb as adminDb, getAdminStorage as adminStorage };