// Test script to verify Firebase setup
import { app, auth } from './config';
import { getAdminApp, getAdminAuth } from './admin';

export async function testFirebaseSetup() {
  console.log('🔥 Testing Firebase Setup...\n');
  
  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables:');
  const clientVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  
  const adminVars = {
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  };
  
  let allVarsSet = true;
  
  Object.entries(clientVars).forEach(([key, value]) => {
    if (value) {
      console.log(`  ✅ ${key} is set`);
    } else {
      console.log(`  ❌ ${key} is NOT set`);
      allVarsSet = false;
    }
  });
  
  Object.entries(adminVars).forEach(([key, value]) => {
    if (value) {
      console.log(`  ✅ ${key} is set`);
    } else {
      console.log(`  ❌ ${key} is NOT set`);
      allVarsSet = false;
    }
  });
  
  if (!allVarsSet) {
    console.log('\n❌ Some environment variables are missing. Please check .env.local');
    return false;
  }
  
  // Test 2: Check Firebase client initialization
  console.log('\n2️⃣ Testing Firebase client initialization:');
  try {
    if (app) {
      console.log('  ✅ Firebase app initialized');
      console.log(`  📱 App name: ${app.name}`);
    }
    
    if (auth) {
      console.log('  ✅ Firebase Auth initialized');
    }
  } catch (error) {
    console.log('  ❌ Firebase client initialization failed:', error);
    return false;
  }
  
  // Test 3: Check Firebase Admin initialization
  console.log('\n3️⃣ Testing Firebase Admin initialization:');
  try {
    const adminApp = getAdminApp();
    if (adminApp) {
      console.log('  ✅ Firebase Admin app initialized');
      console.log(`  🔧 Admin app name: ${adminApp.name}`);
    }
    
    const adminAuthInstance = getAdminAuth();
    if (adminAuthInstance) {
      console.log('  ✅ Firebase Admin Auth initialized');
    }
  } catch (error) {
    console.log('  ❌ Firebase Admin initialization failed:', error);
    return false;
  }
  
  console.log('\n✅ All Firebase setup tests passed!');
  return true;
}