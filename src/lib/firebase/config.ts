import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with the specific database
let db;
if (!getApps().length) {
  db = initializeFirestore(app, {
    // Specify the database ID
    experimentalForceLongPolling: false,
  }, 'dbv2');
} else {
  db = getFirestore(app, 'dbv2');
}

const storage = getStorage(app);

export { app, auth, db, storage };