import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  return initializeApp(firebaseAdminConfig);
}

export const adminAuth = getAuth(getAdminApp());