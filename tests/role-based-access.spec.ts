import { test, expect } from '@playwright/test';
import { login, setUserRole } from './helpers/auth';

const MANAGER_EMAIL = 'raihanstark53@gmail.com';
const MANAGER_PASSWORD = 'raihan';

// Note: For these tests to work, you need to create an employee user in Firebase Console
// or have a test employee account ready
const EMPLOYEE_EMAIL = 'employee@example.com';
const EMPLOYEE_PASSWORD = 'employee123';

test.describe('Role-based Access Control', () => {
  test.beforeAll(async () => {
    // Ensure the manager has the Manager role
    try {
      await setUserRole(MANAGER_EMAIL, 'Manager');
    } catch (error) {
      console.log('Could not set manager role:', error);
    }
  });

  test('Manager can see manager-specific features', async ({ page }) => {
    // Login as manager
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Should see Manager role in the user info card
    await expect(page.locator('text=Manager').first()).toBeVisible();
    
    // Should see manager-specific features
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('text=Menu Items')).toBeVisible();
    
    // Should NOT see employee-specific features
    await expect(page.locator('text=Clock In/Out')).not.toBeVisible();
  });

  test('Manager role displays correctly after login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', MANAGER_EMAIL);
    await page.fill('input[type="password"]', MANAGER_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Check role display in the user info card
    await expect(page.locator('text=Manager').first()).toBeVisible();
  });

  test('Unauthorized users cannot access protected routes', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('Protected routes maintain authentication', async ({ page }) => {
    // Login first
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Navigate to different protected routes
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=' + MANAGER_EMAIL)).toBeVisible();
    
    // Direct navigation should still work
    await page.goto('/dashboard');
    await expect(page.locator('text=' + MANAGER_EMAIL)).toBeVisible();
  });

  // Note: This test requires an employee account to be created
  test.skip('Employee sees employee-specific features', async ({ page }) => {
    // This test is skipped by default as it requires an employee account
    // Remove .skip and ensure EMPLOYEE_EMAIL account exists to run this test
    
    // Set employee role
    await setUserRole(EMPLOYEE_EMAIL, 'Employee');
    
    // Login as employee
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
    
    // Should see Employee role badge
    await expect(page.locator('span:has-text("Employee")')).toBeVisible();
    
    // Should see employee-specific features
    await expect(page.locator('text=Clock In/Out')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Should NOT see manager-specific features
    await expect(page.locator('text=User Management')).not.toBeVisible();
    await expect(page.locator('text=Reports')).not.toBeVisible();
  });
});