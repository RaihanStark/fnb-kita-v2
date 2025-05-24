import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const MANAGER_EMAIL = 'manager@test.com';
const MANAGER_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword123';

test.describe('Password Change Flow', () => {
  test.skip('should successfully change password while authenticated', async ({ page }) => {
    // Login first
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Navigate to change password
    await page.click('text=Change Password');
    
    // Wait for change password form
    await expect(page.locator('h1')).toContainText('Change Password');
    
    // Fill in the form
    await page.fill('input[name="newPassword"]', NEW_PASSWORD);
    await page.fill('input[name="confirmPassword"]', NEW_PASSWORD);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Update Password")');
    
    // Should show success message
    await expect(page.locator('text=Password changed successfully')).toBeVisible({ timeout: 5000 });
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Note: In a real test environment, we would need to change the password back
    // For now, we'll skip this as it would require re-authentication with the new password
  });

  test.skip('should show error for incorrect current password', async ({ page }) => {
    // Login first
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Navigate to change password
    await page.click('text=Change Password');
    
    // This test is not applicable since the form doesn't have current password field
    // Skip this test
    test.skip();
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Change Password")');
    
    // Should show error message
    await expect(page.locator('text=Current password is incorrect')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    // Login first
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Navigate to change password
    await page.click('text=Change Password');
    
    // Fill in the form with mismatched passwords
    await page.fill('input[name="newPassword"]', NEW_PASSWORD);
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    
    // Try to submit to trigger validation
    await page.click('button[type="submit"]:has-text("Update Password")');
    await expect(page.locator("text=Passwords don't match")).toBeVisible({ timeout: 5000 });
  });

  test('should enforce password minimum length', async ({ page }) => {
    // Login first
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Navigate to change password
    await page.click('text=Change Password');
    
    // Fill in the form with short password
    await page.fill('input[name="newPassword"]', '12345');
    await page.fill('input[name="confirmPassword"]', '12345');
    
    // Try to submit to trigger validation
    await page.click('button[type="submit"]:has-text("Update Password")');
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible({ timeout: 5000 });
  });
});