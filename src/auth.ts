import { Page } from 'playwright';
import type { LoginCredentials } from './types.js';

/**
 * Performs login on OpenVC
 * Adjust selectors based on actual login page structure
 */
export async function loginToOpenVC(page: Page, credentials: LoginCredentials): Promise<boolean> {
    try {
        console.log('Navigating to login page...');
        
        // Navigate to login page (adjust URL if needed)
        await page.goto('https://openvc.app/login', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        // Wait for login form to be visible
        // Update these selectors based on actual page structure
        await page.waitForSelector('input[type="email"], input[name="email"], input[id*="email"]', { 
            timeout: 10000 
        });

        // Fill in credentials
        // Adjust selectors based on actual form fields
        await page.fill('input[type="email"], input[name="email"], input[id*="email"]', credentials.email);
        await page.fill('input[type="password"], input[name="password"], input[id*="password"]', credentials.password);

        // Click login button
        // Adjust selector based on actual button
        await page.click('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in"), [class*="login-button"]');

        // Wait for navigation after login (adjust based on what happens after login)
        // Option 1: Wait for URL change
        await page.waitForURL('**/search**', { timeout: 15000 }).catch(() => {
            // Option 2: Wait for a logged-in element
            return page.waitForSelector('[class*="user"], [class*="profile"], [data-testid*="user"]', { timeout: 15000 });
        });

        console.log('Login successful!');
        return true;
    } catch (error) {
        console.error('Login failed:', error);
        // Take screenshot for debugging
        await page.screenshot({ path: 'login-error.png' }).catch(() => {});
        return false;
    }
}

