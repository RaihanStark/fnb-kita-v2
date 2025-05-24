import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';

const MANAGER_EMAIL = 'raihanstark53@gmail.com';
const MANAGER_PASSWORD = 'raihan';

test.describe('Authentication Flow', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page.locator('h1')).toContainText('FnB Kita');
    
    // Fill in login form
    await page.fill('input[type="email"]', MANAGER_EMAIL);
    await page.fill('input[type="password"]', MANAGER_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page.locator('text=' + MANAGER_EMAIL)).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should show error message (check for the actual error text)
    await expect(page.locator('p:has-text("Invalid credentials"), p:has-text("Invalid email or password"), div[role="alert"]')).toBeVisible({ timeout: 5000 });
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should successfully logout', async ({ page }) => {
    // First login
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout button
    await logout(page);
    
    // Verify we're logged out and redirected to login
    await expect(page).toHaveURL('/login');
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to dashboard if already logged in', async ({ page }) => {
    // First login
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);
    
    // Try to access login page
    await page.goto('/login');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});