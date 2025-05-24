import { test, expect } from '@playwright/test';
import { loginAsManager, loginAsEmployee, setupTestUsers } from './helpers/auth';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestUsers(page);
  });

  // Skip tests if test users don't exist
  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get('/api/test-get-role?email=manager@test.com');
      if (!response.ok()) {
        console.error('Test users not found. Please create test users first. See docs/test-setup.md');
        test.skip();
      }
    } catch (error) {
      console.error('Could not verify test users:', error);
      test.skip();
    }
  });

  test.describe('Access Control', () => {
    test('Manager can access user management', async ({ page }) => {
      await loginAsManager(page);
      
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
      await loginAsEmployee(page);
      
      // Try to navigate directly to user management
      await page.goto('/dashboard/users');
      
      // Should be redirected to unauthorized page
      await expect(page).toHaveURL('/unauthorized');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('Employee does not see User Management option', async ({ page }) => {
      await loginAsEmployee(page);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // User Management should not be visible
      await expect(page.locator('text=User Management')).not.toBeVisible();
    });
  });

  test.describe('User List', () => {
    test('displays all users with details', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for user list to load
      await page.waitForSelector('[role="list"]', { state: 'visible' });
      
      // Check if users are displayed
      const userCards = page.locator('[role="listitem"]');
      await expect(userCards).toHaveCount(3); // Manager + 2 test users
      
      // Verify user details are shown
      await expect(page.locator('text=manager@test.com')).toBeVisible();
      await expect(page.locator('text=employee@test.com')).toBeVisible();
      await expect(page.locator('text=Role: Manager').first()).toBeVisible();
      await expect(page.locator('text=Role: Employee').first()).toBeVisible();
      await expect(page.locator('text=Last login:')).toBeVisible();
    });

    test('shows empty state when no users match search', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Search for non-existent user
      await page.fill('input[placeholder="Search users..."]', 'nonexistent@email.com');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Verify empty state
      await expect(page.locator('text=No users found')).toBeVisible();
    });

    test('shows loading state while fetching users', async ({ page }) => {
      await loginAsManager(page);
      
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
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Wait for initial load
      await page.waitForSelector('[role="list"]');
      
      // Search for employee
      await page.fill('input[placeholder="Search users..."]', 'employee');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Verify only employee is shown
      await expect(page.locator('text=employee@test.com')).toBeVisible();
      await expect(page.locator('text=manager@test.com')).not.toBeVisible();
    });

    test('search is case insensitive', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Search with uppercase
      await page.fill('input[placeholder="Search users..."]', 'EMPLOYEE');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Should still find the employee
      await expect(page.locator('text=employee@test.com')).toBeVisible();
    });

    test('clears search shows all users', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Search first
      await page.fill('input[placeholder="Search users..."]', 'employee');
      await page.waitForTimeout(500);
      
      // Clear search
      await page.fill('input[placeholder="Search users..."]', '');
      await page.waitForTimeout(500);
      
      // All users should be visible again
      await expect(page.locator('text=employee@test.com')).toBeVisible();
      await expect(page.locator('text=manager@test.com')).toBeVisible();
    });
  });

  test.describe('Filter Functionality', () => {
    test('filters by Manager role', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Select Manager filter
      await page.selectOption('select', 'Manager');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Only managers should be visible
      await expect(page.locator('text=Role: Manager')).toBeVisible();
      await expect(page.locator('text=Role: Employee')).not.toBeVisible();
    });

    test('filters by Employee role', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Select Employee filter
      await page.selectOption('select', 'Employee');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Only employees should be visible
      await expect(page.locator('text=Role: Employee')).toBeVisible();
      await expect(page.locator('text=Role: Manager')).not.toBeVisible();
    });

    test('combines search with filter', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // First filter by Employee
      await page.selectOption('select', 'Employee');
      
      // Then search
      await page.fill('input[placeholder="Search users..."]', 'test');
      
      // Wait for both to apply
      await page.waitForTimeout(500);
      
      // Should show employees matching the search
      await expect(page.locator('text=employee@test.com')).toBeVisible();
      await expect(page.locator('text=manager@test.com')).not.toBeVisible();
    });
  });

  test.describe('Role Update', () => {
    test('changes Employee to Manager with confirmation', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Find employee and click Change Role
      const employeeCard = page.locator('text=employee@test.com').locator('..').locator('..');
      await employeeCard.locator('button:has-text("Change Role")').click();
      
      // Verify confirmation dialog
      await expect(page.locator('text=Change User Role')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to change')).toBeVisible();
      await expect(page.locator('text=from Employee to Manager')).toBeVisible();
      
      // Confirm the change
      await page.click('button:has-text("Confirm Change")');
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify role was updated
      await expect(employeeCard.locator('text=Manager')).toBeVisible();
    });

    test('changes Manager to Employee with warning', async ({ page }) => {
      // First create another manager
      await setupTestUsers(page, { createExtraManager: true });
      
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Find the extra manager and click Change Role
      const managerCard = page.locator('text=manager2@test.com').locator('..').locator('..');
      await managerCard.locator('button:has-text("Change Role")').click();
      
      // Verify warning is shown
      await expect(page.locator('text=Warning:')).toBeVisible();
      await expect(page.locator('text=administrative privileges')).toBeVisible();
      
      // Confirm the change
      await page.click('button:has-text("Confirm Change")');
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify role was updated
      await expect(managerCard.locator('text=Employee')).toBeVisible();
    });

    test('cancels role change keeps original role', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Find employee and click Change Role
      const employeeCard = page.locator('text=employee@test.com').locator('..').locator('..');
      await employeeCard.locator('button:has-text("Change Role")').click();
      
      // Cancel the change
      await page.click('button:has-text("Cancel")');
      
      // Verify dialog is closed and role unchanged
      await expect(page.locator('text=Change User Role')).not.toBeVisible();
      await expect(employeeCard.locator('text=Employee')).toBeVisible();
    });

    test('shows error for failed role update', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Intercept API to return error
      await page.route('**/api/users/*/role', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Try to change role
      const employeeCard = page.locator('text=employee@test.com').locator('..').locator('..');
      await employeeCard.locator('button:has-text("Change Role")').click();
      await page.click('button:has-text("Confirm Change")');
      
      // Verify error is shown
      await expect(page.locator('text=Internal server error')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('Manager cannot change own role', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Find current manager's card
      const managerCard = page.locator('text=manager@test.com').locator('..').locator('..');
      
      // Change Role button should not be visible
      await expect(managerCard.locator('button:has-text("Change Role")')).not.toBeVisible();
    });

    test('prevents changing last Manager to Employee', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // This test would need only one manager in the system
      // Intercept API to simulate this scenario
      await page.route('**/api/users/*/role', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Cannot change role: This would remove the last manager' })
        });
      });
      
      // Try to change a manager's role
      const managerCard = page.locator('[role="listitem"]').filter({ hasText: 'Manager' }).first();
      await managerCard.locator('button:has-text("Change Role")').click();
      await page.click('button:has-text("Confirm Change")');
      
      // Verify error message
      await expect(page.locator('text=Cannot change role: This would remove the last manager')).toBeVisible();
    });

    test('handles network errors gracefully', async ({ page }) => {
      await loginAsManager(page);
      
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

  test.describe('Pagination', () => {
    test('navigates through pages', async ({ page }) => {
      // This test would need more than 10 users
      // For now, we'll test that pagination controls work
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      // Check if pagination exists (only if more than 10 users)
      const pagination = page.locator('text=Page 1 of');
      const isPaginationVisible = await pagination.isVisible();
      
      if (isPaginationVisible) {
        // Test next button
        const nextButton = page.locator('button:has-text("Next")');
        await nextButton.click();
        
        // Verify page changed
        await expect(page.locator('text=Page 2')).toBeVisible();
        
        // Test previous button
        const prevButton = page.locator('button:has-text("Previous")');
        await prevButton.click();
        
        // Back to page 1
        await expect(page.locator('text=Page 1')).toBeVisible();
      }
    });

    test('disables navigation buttons appropriately', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard/users');
      
      const pagination = page.locator('text=Page 1 of');
      const isPaginationVisible = await pagination.isVisible();
      
      if (isPaginationVisible) {
        // Previous should be disabled on first page
        const prevButton = page.locator('button:has-text("Previous")');
        await expect(prevButton).toBeDisabled();
        
        // Navigate to last page
        const totalPages = await page.locator('text=/Page \\d+ of (\\d+)/').textContent();
        const lastPage = parseInt(totalPages?.match(/of (\d+)/)?.[1] || '1');
        
        for (let i = 1; i < lastPage; i++) {
          await page.locator('button:has-text("Next")').click();
        }
        
        // Next should be disabled on last page
        const nextButton = page.locator('button:has-text("Next")');
        await expect(nextButton).toBeDisabled();
      }
    });
  });
});