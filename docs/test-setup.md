# Test Setup Guide

## Prerequisites for E2E Tests

Before running E2E tests, you need to create test users in your Firebase project.

### Creating Test Users

1. Go to your Firebase Console
2. Navigate to Authentication > Users
3. Create the following test users:

| Email | Password | Initial Role |
|-------|----------|--------------|
| manager@test.com | password123 | Manager |
| employee@test.com | password123 | Employee |
| employee2@test.com | password123 | Employee |
| manager2@test.com | password123 | Manager |

### Alternative: Using Firebase Admin SDK

You can also create test users programmatically. Create a script `scripts/create-test-users.ts`:

```typescript
import { getAdminApp } from '../src/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

const adminAuth = getAuth(getAdminApp());

async function createTestUsers() {
  const testUsers = [
    { email: 'manager@test.com', password: 'password123', role: 'Manager' },
    { email: 'employee@test.com', password: 'password123', role: 'Employee' },
    { email: 'employee2@test.com', password: 'password123', role: 'Employee' },
    { email: 'manager2@test.com', password: 'password123', role: 'Manager' },
  ];

  for (const userData of testUsers) {
    try {
      // Create user
      const user = await adminAuth.createUser({
        email: userData.email,
        password: userData.password,
        emailVerified: true,
      });
      
      // Set custom claims
      await adminAuth.setCustomUserClaims(user.uid, { role: userData.role });
      
      console.log(`Created user: ${userData.email} with role: ${userData.role}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`User ${userData.email} already exists`);
        // Update role for existing user
        const existingUser = await adminAuth.getUserByEmail(userData.email);
        await adminAuth.setCustomUserClaims(existingUser.uid, { role: userData.role });
        console.log(`Updated role for ${userData.email} to ${userData.role}`);
      } else {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }
  }
}

createTestUsers().catch(console.error);
```

Run this script with:
```bash
npx tsx scripts/create-test-users.ts
```

## Running E2E Tests

Once test users are created:

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/user-management.spec.ts

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

## Test Environment

The tests expect the application to be running on http://localhost:3001. The test configuration will automatically start the dev server if it's not already running.

## Troubleshooting

### "User not found" errors
- Ensure test users are created in Firebase before running tests
- Check that the Firebase project credentials are correctly configured

### Authentication errors
- Verify that test users have the correct passwords
- Check that email verification is not required (test users should have `emailVerified: true`)

### Role-related errors
- Use the test API endpoints to verify/set user roles:
  - GET `/api/test-get-role?email=user@test.com`
  - POST `/api/test-set-role?email=user@test.com&role=Manager`