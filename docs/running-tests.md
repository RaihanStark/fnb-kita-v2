# Running User Management Tests

## Prerequisites

The E2E tests require actual users to exist in Firebase Authentication. The tests have been updated to work with real users rather than test-specific accounts.

### Required Users

You need at least:
1. One user with Manager role
2. One user with Employee role

### Setting Up Users

#### Option 1: Use Existing Users
If you already have users in your Firebase project, update the test file with their credentials:

```typescript
// In tests/user-management.spec.ts
const EXISTING_MANAGER = { email: 'your-manager@email.com', password: 'your-password' };
const EXISTING_EMPLOYEE = { email: 'your-employee@email.com', password: 'your-password' };
```

#### Option 2: Create Test Users
1. Go to Firebase Console > Authentication > Users
2. Create new users with known passwords
3. Set their roles using the test API:
   ```bash
   curl -X POST "http://localhost:3001/api/test-set-role?email=manager@example.com&role=Manager"
   curl -X POST "http://localhost:3001/api/test-set-role?email=employee@example.com&role=Employee"
   ```

## Running Tests

```bash
# Run all user management tests
npm run test:e2e -- tests/user-management.spec.ts

# Run specific test
npm run test:e2e -- tests/user-management.spec.ts -g "Manager can access"

# Run with UI mode for debugging
npm run test:e2e:ui -- tests/user-management.spec.ts

# Run in headed mode to see the browser
npm run test:e2e:headed -- tests/user-management.spec.ts
```

## Test Structure

The tests are organized into categories:
- **Access Control**: Tests that managers can access user management and employees cannot
- **User List**: Tests displaying users, search, and filtering
- **Role Management**: Tests changing user roles with appropriate validations
- **Error Handling**: Tests network errors and edge cases

## Troubleshooting

### Login Failures
If tests fail at login:
1. Verify the user credentials are correct
2. Check that users exist in Firebase
3. Ensure the dev server is running on port 3001

### Missing Users
Some tests will skip if required data is not available (e.g., no employees to test role changes).

### Role Verification
Use the test API to verify user roles:
```bash
curl "http://localhost:3001/api/test-get-role?email=user@example.com"
```

## Notes

- Tests are designed to work with any existing data
- Tests will skip gracefully when required conditions aren't met
- The tests do not create or delete users - they work with existing data