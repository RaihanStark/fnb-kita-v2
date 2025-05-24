import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  User
} from 'firebase/auth';
import { auth } from './config';

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { user: null, error: errorMessage };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: errorMessage };
  }
}

export async function changePassword(newPassword: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    await updatePassword(user, newPassword);
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: errorMessage };
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}