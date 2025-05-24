# Firebase Setup Documentation

## Phase 1 Completed ✅

### What was implemented:

1. **Dependencies Installed**
   - `firebase` - Client-side Firebase SDK
   - `firebase-admin` - Server-side Firebase Admin SDK

2. **Firebase Configuration Files**
   - `/src/lib/firebase/config.ts` - Client-side Firebase initialization
   - `/src/lib/firebase/admin.ts` - Server-side Firebase Admin initialization
   - `/src/lib/firebase/auth-service.ts` - Server-side auth utilities (roles, token verification)
   - `/src/lib/firebase/auth-client.ts` - Client-side auth utilities (sign in, sign out, password change)

3. **Environment Variables**
   - Created `.env.local.example` template
   - Added `.env.local` to `.gitignore`

### Next Steps:

1. **Configure Firebase Project**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication with Email/Password provider
   - Get your Firebase configuration values

2. **Set Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in the Firebase configuration values:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY=your-private-key
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PROJECT_ID=your-project-id
     ```

3. **Create Users Manually**
   - Go to Firebase Console > Authentication > Users
   - Add users manually with email/password
   - Use the Firebase Admin SDK to set custom claims for roles

### Available Functions:

**Client-side (`auth-client.ts`):**
- `signIn(email, password)` - Sign in a user
- `signOut()` - Sign out current user
- `changePassword(newPassword)` - Change password for authenticated user
- `subscribeToAuthChanges(callback)` - Listen to auth state changes
- `getIdToken()` - Get current user's ID token

**Server-side (`auth-service.ts`):**
- `setUserRole(uid, role)` - Set user role (Manager/Employee)
- `getUserRole(uid)` - Get user's role
- `verifyIdToken(idToken)` - Verify Firebase ID token

### Role Types:
- `Manager` - Manager role with elevated permissions
- `Employee` - Standard employee role