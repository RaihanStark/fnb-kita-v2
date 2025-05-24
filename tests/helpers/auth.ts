import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  // Click logout button
  await page.click('button:has-text("Logout")');
  
  // Wait for navigation to login page
  await page.waitForURL('/login', { timeout: 5000 });
}

export async function setUserRole(email: string, role: 'Manager' | 'Employee') {
  const response = await fetch(`http://localhost:3001/api/test-set-role?email=${email}&role=${role}`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to set role: ${await response.text()}`);
  }
  
  return await response.json();
}

export async function setupTestUsers(page: Page, options?: { createExtraManager?: boolean }) {
  // Note: Test users must already exist in Firebase Auth
  // These test users should be created in your Firebase project before running tests
  try {
    await setUserRole('manager@test.com', 'Manager');
  } catch (error) {
    console.warn('Could not set role for manager@test.com - user may not exist');
  }
  
  try {
    await setUserRole('employee@test.com', 'Employee');
  } catch (error) {
    console.warn('Could not set role for employee@test.com - user may not exist');
  }
  
  try {
    await setUserRole('employee2@test.com', 'Employee');
  } catch (error) {
    console.warn('Could not set role for employee2@test.com - user may not exist');
  }
  
  if (options?.createExtraManager) {
    try {
      await setUserRole('manager2@test.com', 'Manager');
    } catch (error) {
      console.warn('Could not set role for manager2@test.com - user may not exist');
    }
  }
}

export async function loginAsManager(page: Page) {
  await login(page, 'manager@test.com', 'password123');
}

export async function loginAsEmployee(page: Page) {
  await login(page, 'employee@test.com', 'password123');
}