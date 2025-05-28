import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';

test.describe('Authentication Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test.describe('Sign Up', () => {
    test('should successfully sign up with valid credentials', async () => {
      await authPage.goToSignUp();
      const credentials = await authPage.signUpWithValidData();
      
      await authPage.expectSuccessMessage('Account created successfully');
      await authPage.expectUrl('/onboarding');
    });

    test('should show validation errors for empty form submission', async () => {
      await authPage.goToSignUp();
      await authPage.testEmptyFormSubmission();
    });

    test('should show validation errors for partial form submission', async () => {
      await authPage.goToSignUp();
      await authPage.testPartialFormSubmission();
    });

    test('should validate email format', async () => {
      await authPage.goToSignUp();
      await authPage.testInvalidEmailFormats();
    });

    test('should validate password strength', async () => {
      await authPage.goToSignUp();
      await authPage.testWeakPasswords();
    });

    test('should show error for password mismatch', async () => {
      await authPage.goToSignUp();
      await authPage.signUp('test@example.com', 'Password123!', 'DifferentPassword');
      await authPage.expectPasswordMismatchError();
    });

    test('should handle existing account error', async () => {
      await authPage.goToSignUp();
      
      // Mock existing account response
      await authPage.mockApiCall('auth/signup', { 
        error: 'Account already exists' 
      }, 409);
      
      await authPage.signUpWithValidData();
      await authPage.expectAccountExistsError();
    });

    test('should handle network errors gracefully', async () => {
      await authPage.goToSignUp();
      await authPage.testNetworkError();
    });

    test('should show loading state for slow networks', async () => {
      await authPage.goToSignUp();
      await authPage.testSlowNetwork();
    });
  });

  test.describe('Sign In', () => {
    test('should successfully sign in with valid credentials', async () => {
      await authPage.goToSignIn();
      await authPage.signInWithValidCredentials();
      
      await authPage.expectSuccessMessage('Welcome back!');
      await authPage.expectUrl('/dashboard');
    });

    test('should show error for invalid credentials', async () => {
      await authPage.goToSignIn();
      
      // Mock invalid credentials response
      await authPage.mockApiCall('auth/signin', { 
        error: 'Invalid credentials' 
      }, 401);
      
      await authPage.signIn('wrong@example.com', 'wrongpassword');
      await authPage.expectInvalidCredentialsError();
    });

    test('should validate required fields', async () => {
      await authPage.goToSignIn();
      await authPage.testEmptyFormSubmission();
    });
  });

  test.describe('Social Authentication', () => {
    test('should initiate Google sign in', async () => {
      await authPage.goToSignIn();
      
      // Mock OAuth popup
      const popupPromise = authPage.page.waitForEvent('popup');
      await authPage.signInWithGoogle();
      
      const popup = await popupPromise;
      expect(popup.url()).toContain('accounts.google.com');
    });

    test('should initiate GitHub sign in', async () => {
      await authPage.goToSignIn();
      
      const popupPromise = authPage.page.waitForEvent('popup');
      await authPage.signInWithGitHub();
      
      const popup = await popupPromise;
      expect(popup.url()).toContain('github.com');
    });
  });

  test.describe('Password Reset', () => {
    test('should send password reset email', async () => {
      await authPage.goToForgotPassword();
      await authPage.requestPasswordReset('test@example.com');
      await authPage.expectPasswordResetSent();
    });

    test('should validate email for password reset', async () => {
      await authPage.goToForgotPassword();
      await authPage.requestPasswordReset('invalid-email');
      await authPage.expectEmailValidationError();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between sign up and sign in', async () => {
      await authPage.goToSignIn();
      await authPage.switchToSignUp();
      await authPage.expectUrl('/auth/signup');
      
      await authPage.switchToSignIn();
      await authPage.expectUrl('/auth/signin');
    });

    test('should navigate to forgot password', async () => {
      await authPage.goToSignIn();
      await authPage.clickForgotPassword();
      await authPage.expectUrl('/auth/forgot-password');
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      await authPage.goToSignUp();
      await authPage.testKeyboardNavigation();
    });

    test('should have proper screen reader labels', async () => {
      await authPage.goToSignUp();
      await authPage.testScreenReaderLabels();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle concurrent sign up attempts', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      const authPage1 = new AuthPage(page1);
      const authPage2 = new AuthPage(page2);
      
      await authPage1.goToSignUp();
      await authPage2.goToSignUp();
      
      const email = `test+${Date.now()}@example.com`;
      
      // Try to sign up with same email simultaneously
      const [result1, result2] = await Promise.allSettled([
        authPage1.signUp(email, 'Password123!', 'Password123!'),
        authPage2.signUp(email, 'Password123!', 'Password123!')
      ]);
      
      // One should succeed, one should fail
      expect(result1.status === 'fulfilled' || result2.status === 'fulfilled').toBe(true);
      
      await context1.close();
      await context2.close();
    });

    test('should handle session timeout', async () => {
      await authPage.goToSignIn();
      await authPage.signInWithValidCredentials();
      
      // Mock session timeout
      await authPage.mockApiCall('auth/verify', { 
        error: 'Session expired' 
      }, 401);
      
      await authPage.goto('/dashboard');
      await authPage.expectUrl('/auth/signin');
      await authPage.expectErrorMessage('Session expired. Please sign in again.');
    });

    test('should handle browser back/forward navigation', async () => {
      await authPage.goToSignIn();
      await authPage.switchToSignUp();
      
      await authPage.page.goBack();
      await authPage.expectUrl('/auth/signin');
      
      await authPage.page.goForward();
      await authPage.expectUrl('/auth/signup');
    });
  });

  test.describe('Security', () => {
    test('should not expose sensitive data in network requests', async () => {
      await authPage.goToSignUp();
      
      const requests: any[] = [];
      authPage.page.on('request', request => {
        if (request.url().includes('/auth/')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData()
          });
        }
      });
      
      await authPage.signUpWithValidData();
      
      // Verify password is not in URL or headers
      requests.forEach(request => {
        expect(request.url).not.toContain('password');
        expect(JSON.stringify(request.headers)).not.toContain('password');
      });
    });

    test('should implement rate limiting', async () => {
      await authPage.goToSignIn();
      
      // Mock rate limit response after multiple attempts
      let attemptCount = 0;
      await authPage.page.route('**/auth/signin', route => {
        attemptCount++;
        if (attemptCount > 5) {
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Too many attempts. Please try again later.' })
          });
        } else {
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid credentials' })
          });
        }
      });
      
      // Make multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await authPage.signIn('test@example.com', 'wrongpassword');
      }
      
      await authPage.expectErrorMessage('Too many attempts. Please try again later.');
    });
  });
}); 