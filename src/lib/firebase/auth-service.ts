import { adminAuth } from './admin';

export type UserRole = 'Manager' | 'Employee';

export interface CustomClaims {
  role: UserRole;
}

export async function setUserRole(uid: string, role: UserRole) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    return false;
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const user = await adminAuth.getUser(uid);
    const claims = user.customClaims as CustomClaims | undefined;
    return claims?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}