import { test, expect } from '@playwright/test';

// Helper to login with any existing manager account
async function loginAsAnyManager(page) {
  await page.goto('/login');
  // Try common manager accounts
  const managerAccounts = [
    { email: 'raihanstark53@gmail.com', password: 'password123' },
    { email: 'manager@test.com', password: 'password123' },
    { email: 'admin@test.com', password: 'password123' }
  ];
  
  for (const account of managerAccounts) {
    try {
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', account.password);
      await page.click('button[type="submit"]');
      
      // Check if login successful
      await page.waitForURL('/dashboard', { timeout: 5000 });
      
      // Verify it's a manager by checking if User Management is visible
      const hasUserManagement = await page.locator('text=User Management').isVisible();
      if (hasUserManagement) {
        return account.email;
      }
    } catch (error) {
      // Try next account
      continue;
    }
  }
  
  throw new Error('No manager account available for testing');
}

// Helper to login with any existing employee account
async function loginAsAnyEmployee(page) {
  await page.goto('/login');
  // Try common employee accounts
  const employeeAccounts = [
    { email: 'employee@test.com', password: 'password123' },
    { email: 'raihan@gmail.com', password: 'password123' },
    { email: 'staff@test.com', password: 'password123' }
  ];
  
  for (const account of employeeAccounts) {
    try {
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', account.password);
      await page.click('button[type="submit"]');
      
      // Check if login successful
      await page.waitForURL('/dashboard', { timeout: 5000 });
      
      // Verify it's an employee by checking User Management is NOT visible
      const hasUserManagement = await page.locator('text=User Management').isVisible();
      if (!hasUserManagement) {
        return account.email;
      }
    } catch (error) {
      // Try next account
      continue;
    }
  }
  
  // If no employee found, that's okay for some tests
  return null;
}

test.describe('User Management', () => {
  let managerEmail: string;

  test.beforeAll(async ({ page }) => {
    try {
      managerEmail = await loginAsAnyManager(page);
      console.log(`Using manager account: ${managerEmail}`);
    } catch (error) {
      console.error('Could not find a manager account. Skipping tests.');
      test.skip();
    }
  });

  test.describe('Access Control', () => {
    test('Manager can access user management', async ({ page }) => {
      await loginAsAnyManager(page);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForSelector('text=User Management');
      
      // Click on User Management
      await page.click('text=User Management');
      
      // Verify we're on the user management page
      await expect(page).toHaveURL('/dashboard/users');
      await expect(page.locator('h1')).toContainText('User Management');
    });

    test('Employee cannot access user management', async ({ page }) => {
      const employeeEmail = await loginAsAnyEmployee(page);
      if (!employeeEmail) {
        test.skip();
        return;
      }
      
      // Try to navigate directly to user management
      await page.goto('/dashboard/users');
      
      // Should be redirected to unauthorized page
      await expect(page).toHaveURL('/unauthorized');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('Employee does not see User Management option', async ({ page }) => {
      const employeeEmail = await loginAsAnyEmployee(page);
      if (!employeeEmail) {
        test.skip();
        return;
      }
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // User Management should not be visible
      await expect(page.locator('text=User Management')).not.toBeVisible();
    });
  });

  test.describe('User List', () => {
    test('displays users with details', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for user list to load
      await page.waitForSelector('[role="list"]', { state: 'visible' });
      
      // Check that users are displayed
      const userCards = page.locator('[role="listitem"]');
      await expect(userCards.first()).toBeVisible();
      
      // Verify user details structure exists
      await expect(page.locator('text=/Role: (Manager|Employee)/').first()).toBeVisible();
      await expect(page.locator('text=Last login:').first()).toBeVisible();
      
      // Check email format
      await expect(page.locator('[role="listitem"] >> text=/@/').first()).toBeVisible();
    });

    test('shows empty state when no users match search', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Search for non-existent user
      await page.fill('input[placeholder="Search users..."]', 'nonexistent9999@email.com');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Verify empty state
      await expect(page.locator('text=No users found')).toBeVisible();
    });

    test('shows loading state while fetching users', async ({ page }) => {
      await loginAsAnyManager(page);
      
      // Intercept the API call to delay it
      await page.route('**/api/users*', async route => {
        await page.waitForTimeout(1000);
        await route.continue();
      });
      
      await page.goto('/dashboard/users');
      
      // Verify loading state
      await expect(page.locator('text=Loading users...')).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('searches users by email', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load
      await page.waitForSelector('[role="list"]');
      
      // Get the first user's email
      const firstUserEmail = await page.locator('[role="listitem"] h3').first().textContent();
      if (!firstUserEmail) {
        test.skip();
        return;
      }
      
      // Search for part of that email
      const searchTerm = firstUserEmail.split('@')[0];
      await page.fill('input[placeholder="Search users..."]', searchTerm);
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Verify the user is still visible
      await expect(page.locator(`text=${firstUserEmail}`)).toBeVisible();
    });

    test('search is case insensitive', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load
      await page.waitForSelector('[role="list"]');
      
      // Get the first user's email
      const firstUserEmail = await page.locator('[role="listitem"] h3').first().textContent();
      if (!firstUserEmail) {
        test.skip();
        return;
      }
      
      // Search with uppercase
      const searchTerm = firstUserEmail.split('@')[0].toUpperCase();
      await page.fill('input[placeholder="Search users..."]', searchTerm);
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Should still find the user
      await expect(page.locator(`text=${firstUserEmail}`)).toBeVisible();
    });

    test('clears search shows all users', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load and count users
      await page.waitForSelector('[role="list"]');
      const initialCount = await page.locator('[role="listitem"]').count();
      
      // Search for something specific
      await page.fill('input[placeholder="Search users..."]', 'xyz999');
      await page.waitForTimeout(500);
      
      // Clear search
      await page.fill('input[placeholder="Search users..."]', '');
      await page.waitForTimeout(500);
      
      // Should show same number of users as before
      const afterClearCount = await page.locator('[role="listitem"]').count();
      expect(afterClearCount).toBe(initialCount);
    });
  });

  test.describe('Filter Functionality', () => {
    test('filters by Manager role', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load
      await page.waitForSelector('[role="list"]');
      
      // Select Manager filter
      await page.selectOption('select', 'Manager');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Wait for filtered results
      await page.waitForSelector('[role="listitem"]');
      
      // All visible users should be managers
      const visibleRoles = await page.locator('[role="listitem"] >> text=/Role: \\w+/').allTextContents();
      for (const role of visibleRoles) {
        expect(role).toContain('Manager');
      }
    });

    test('filters by Employee role', async ({ page }) => {
      await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load
      await page.waitForSelector('[role="list"]');
      
      // Select Employee filter
      await page.selectOption('select', 'Employee');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Check if any employees exist
      const hasEmployees = await page.locator('[role="listitem"]').count() > 0;
      
      if (hasEmployees) {
        // All visible users should be employees
        const visibleRoles = await page.locator('[role="listitem"] >> text=/Role: \\w+/').allTextContents();
        for (const role of visibleRoles) {
          expect(role).toContain('Employee');
        }
      } else {
        // If no employees, verify empty state
        await expect(page.locator('text=No users found')).toBeVisible();
      }
    });
  });

  test.describe('Role Update', () => {
    test('shows role change dialog', async ({ page }) => {
      const currentManagerEmail = await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for user list
      await page.waitForSelector('[role="list"]');
      
      // Find a user that is not the current manager
      const userCards = page.locator('[role="listitem"]');
      const count = await userCards.count();
      
      let targetUser = null;
      for (let i = 0; i < count; i++) {
        const email = await userCards.nth(i).locator('h3').textContent();
        if (email && email !== currentManagerEmail) {
          const hasChangeButton = await userCards.nth(i).locator('button:has-text("Change Role")').isVisible();
          if (hasChangeButton) {
            targetUser = userCards.nth(i);
            break;
          }
        }
      }
      
      if (!targetUser) {
        test.skip();
        return;
      }
      
      // Click Change Role
      await targetUser.locator('button:has-text("Change Role")').click();
      
      // Verify confirmation dialog
      await expect(page.locator('text=Change User Role')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to change')).toBeVisible();
      
      // Cancel for this test
      await page.click('button:has-text("Cancel")');
      
      // Verify dialog is closed
      await expect(page.locator('text=Change User Role')).not.toBeVisible();
    });

    test('Manager cannot change own role', async ({ page }) => {
      const currentManagerEmail = await loginAsAnyManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for user list
      await page.waitForSelector('[role="list"]');
      
      // Find current manager's card
      const managerCard = page.locator('[role="listitem"]').filter({ hasText: currentManagerEmail });
      
      // Change Role button should not be visible for own account
      await expect(managerCard.locator('button:has-text("Change Role")')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      await loginAsAnyManager(page);
      
      // Simulate network error
      await page.route('**/api/users*', route => route.abort());
      
      await page.goto('/dashboard/users');
      
      // Should show error state
      await expect(page.locator('text=Failed to fetch users')).toBeVisible();
      
      // Retry button should be visible
      const retryButton = page.locator('button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
      
      // Remove network error and retry
      await page.unroute('**/api/users*');
      await retryButton.click();
      
      // Should load users successfully
      await expect(page.locator('[role="list"]')).toBeVisible();
    });
  });
});