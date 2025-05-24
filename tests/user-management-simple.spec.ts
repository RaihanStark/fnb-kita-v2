import { test, expect } from '@playwright/test';

// Simple login helper - assumes test users exist
async function login(page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('User Management', () => {
  // Use a real manager account that exists in your system
  const MANAGER_EMAIL = 'raihanstark53@gmail.com';
  const MANAGER_PASSWORD = 'password123';
  
  // Use any employee account that exists
  const EMPLOYEE_EMAIL = 'raihan@gmail.com';
  const EMPLOYEE_PASSWORD = 'password123';

  test.describe('Access Control', () => {
    test('Manager can access user management', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      
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
      await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
      
      // Try to navigate directly to user management
      await page.goto('/dashboard/users');
      
      // Should be redirected to unauthorized page
      await expect(page).toHaveURL('/unauthorized');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });
  });

  test.describe('User List', () => {
    test('displays users with details', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Wait for user list to load
      await page.waitForSelector('[role="list"]', { state: 'visible' });
      
      // Check that users are displayed
      const userCards = page.locator('[role="listitem"]');
      await expect(userCards.first()).toBeVisible();
      
      // Verify user details structure exists
      await expect(page.locator('text=/Role: (Manager|Employee)/').first()).toBeVisible();
      await expect(page.locator('text=Last login:').first()).toBeVisible();
    });

    test('shows empty state when no users match search', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Search for non-existent user
      await page.fill('input[placeholder="Search users..."]', 'nonexistent9999@email.com');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Verify empty state
      await expect(page.locator('text=No users found')).toBeVisible();
    });
  });

  test.describe('Search and Filter', () => {
    test('search is case insensitive', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Wait for list to load
      await page.waitForSelector('[role="list"]');
      
      // Search with uppercase
      await page.fill('input[placeholder="Search users..."]', 'RAIHAN');
      await page.waitForTimeout(500);
      
      // Should find users with 'raihan' in email
      const results = await page.locator('[role="listitem"]').count();
      expect(results).toBeGreaterThan(0);
    });

    test('filters by role', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Wait for list to load
      await page.waitForSelector('[role="list"]');
      
      // Select Manager filter
      await page.selectOption('select', 'Manager');
      await page.waitForTimeout(500);
      
      // All visible users should be managers
      const visibleRoles = await page.locator('[role="listitem"] >> text=/Role: \\w+/').allTextContents();
      for (const role of visibleRoles) {
        expect(role).toContain('Manager');
      }
      
      // Select Employee filter
      await page.selectOption('select', 'Employee');
      await page.waitForTimeout(500);
      
      // Check if any employees exist
      const hasEmployees = await page.locator('[role="listitem"]').count() > 0;
      
      if (hasEmployees) {
        // All visible users should be employees
        const employeeRoles = await page.locator('[role="listitem"] >> text=/Role: \\w+/').allTextContents();
        for (const role of employeeRoles) {
          expect(role).toContain('Employee');
        }
      }
    });
  });

  test.describe('Role Management', () => {
    test('Manager cannot change own role', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Wait for user list
      await page.waitForSelector('[role="list"]');
      
      // Find current manager's card
      const managerCard = page.locator('[role="listitem"]').filter({ hasText: MANAGER_EMAIL });
      
      // Change Role button should not be visible for own account
      await expect(managerCard.locator('button:has-text("Change Role")')).not.toBeVisible();
    });

    test('shows role change dialog', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      await page.goto('/dashboard/users');
      
      // Wait for user list
      await page.waitForSelector('[role="list"]');
      
      // Find any user with Change Role button (not the current manager)
      const changeButtons = page.locator('button:has-text("Change Role")');
      const buttonCount = await changeButtons.count();
      
      if (buttonCount > 0) {
        // Click the first available Change Role button
        await changeButtons.first().click();
        
        // Verify confirmation dialog
        await expect(page.locator('text=Change User Role')).toBeVisible();
        await expect(page.locator('text=Are you sure you want to change')).toBeVisible();
        
        // Cancel
        await page.click('button:has-text("Cancel")');
        
        // Verify dialog is closed
        await expect(page.locator('text=Change User Role')).not.toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
      
      // Simulate network error
      await page.route('**/api/users*', route => route.abort());
      
      await page.goto('/dashboard/users');
      
      // Should show error state
      await expect(page.locator('text=Failed to fetch users')).toBeVisible();
      
      // Retry button should be visible
      const retryButton = page.locator('button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
    });
  });
});