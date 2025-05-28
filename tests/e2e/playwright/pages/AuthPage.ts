import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  // Selectors
  private readonly emailInput = '[data-testid="email-input"], input[type="email"]';
  private readonly passwordInput = '[data-testid="password-input"], input[type="password"]';
  private readonly confirmPasswordInput = '[data-testid="confirm-password-input"]';
  private readonly signUpButton = '[data-testid="signup-button"], button:has-text("Sign Up")';
  private readonly signInButton = '[data-testid="signin-button"], button:has-text("Sign In")';
  private readonly forgotPasswordLink = '[data-testid="forgot-password"], a:has-text("Forgot Password")';
  private readonly signUpLink = '[data-testid="signup-link"], a:has-text("Sign Up")';
  private readonly signInLink = '[data-testid="signin-link"], a:has-text("Sign In")';
  private readonly googleSignInButton = '[data-testid="google-signin"], button:has-text("Google")';
  private readonly githubSignInButton = '[data-testid="github-signin"], button:has-text("GitHub")';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goToSignUp() {
    await this.goto('/auth/signup');
  }

  async goToSignIn() {
    await this.goto('/auth/signin');
  }

  async goToForgotPassword() {
    await this.goto('/auth/forgot-password');
  }

  // Sign Up Flow
  async signUp(email: string, password: string, confirmPassword?: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    
    if (confirmPassword !== undefined) {
      await this.fillInput(this.confirmPasswordInput, confirmPassword);
    }
    
    await this.clickElement(this.signUpButton);
  }

  async signUpWithValidData() {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await this.signUp(testEmail, testPassword, testPassword);
    return { email: testEmail, password: testPassword };
  }

  // Sign In Flow
  async signIn(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.signInButton);
  }

  async signInWithValidCredentials() {
    await this.signIn('test@example.com', 'TestPassword123!');
  }

  // Social Authentication
  async signInWithGoogle() {
    await this.clickElement(this.googleSignInButton);
  }

  async signInWithGitHub() {
    await this.clickElement(this.githubSignInButton);
  }

  // Password Reset
  async requestPasswordReset(email: string) {
    await this.fillInput(this.emailInput, email);
    await this.clickElement('[data-testid="reset-password-button"], button:has-text("Reset Password")');
  }

  // Navigation between auth forms
  async switchToSignUp() {
    await this.clickElement(this.signUpLink);
  }

  async switchToSignIn() {
    await this.clickElement(this.signInLink);
  }

  async clickForgotPassword() {
    await this.clickElement(this.forgotPasswordLink);
  }

  // Validation and Error States
  async expectEmailValidationError() {
    await this.expectFormValidationError('email', 'Please enter a valid email address');
  }

  async expectPasswordValidationError() {
    await this.expectFormValidationError('password', 'Password must be at least 8 characters');
  }

  async expectPasswordMismatchError() {
    await this.expectFormValidationError('confirm-password', 'Passwords do not match');
  }

  async expectInvalidCredentialsError() {
    await this.expectErrorMessage('Invalid email or password');
  }

  async expectAccountExistsError() {
    await this.expectErrorMessage('An account with this email already exists');
  }

  async expectPasswordResetSent() {
    await this.expectSuccessMessage('Password reset email sent');
  }

  // Empty State Tests
  async testEmptyFormSubmission() {
    await this.clickElement(this.signUpButton);
    await this.expectFormValidationError('email', 'Email is required');
    await this.expectFormValidationError('password', 'Password is required');
  }

  async testPartialFormSubmission() {
    await this.fillInput(this.emailInput, 'test@example.com');
    await this.clickElement(this.signUpButton);
    await this.expectFormValidationError('password', 'Password is required');
  }

  // Edge Cases
  async testInvalidEmailFormats() {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example',
    ];

    for (const email of invalidEmails) {
      await this.fillInput(this.emailInput, email);
      await this.fillInput(this.passwordInput, 'TestPassword123!');
      await this.clickElement(this.signUpButton);
      await this.expectEmailValidationError();
      
      // Clear form for next iteration
      await this.page.fill(this.emailInput, '');
      await this.page.fill(this.passwordInput, '');
    }
  }

  async testWeakPasswords() {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abcdefgh',
      'PASSWORD',
    ];

    for (const password of weakPasswords) {
      await this.fillInput(this.emailInput, 'test@example.com');
      await this.fillInput(this.passwordInput, password);
      await this.clickElement(this.signUpButton);
      await this.expectPasswordValidationError();
      
      // Clear form for next iteration
      await this.page.fill(this.emailInput, '');
      await this.page.fill(this.passwordInput, '');
    }
  }

  // Network Error Simulation
  async testNetworkError() {
    // Mock network failure
    await this.mockApiCall('auth/signup', { error: 'Network error' }, 500);
    
    await this.signUpWithValidData();
    await this.expectErrorMessage('Something went wrong. Please try again.');
  }

  async testSlowNetwork() {
    // Mock slow response
    await this.page.route('**/auth/signup', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await this.signUpWithValidData();
    
    // Should show loading state
    await this.expectElementToBeVisible('.loading, .spinner, [data-testid="loading"]');
  }

  // Accessibility Tests
  async testKeyboardNavigation() {
    await this.page.keyboard.press('Tab'); // Email field
    await this.expectElementToBeVisible(`${this.emailInput}:focus`);
    
    await this.page.keyboard.press('Tab'); // Password field
    await this.expectElementToBeVisible(`${this.passwordInput}:focus`);
    
    await this.page.keyboard.press('Tab'); // Submit button
    await this.expectElementToBeVisible(`${this.signUpButton}:focus`);
  }

  async testScreenReaderLabels() {
    await this.expectElementToBeVisible(`${this.emailInput}[aria-label], ${this.emailInput}[aria-labelledby]`);
    await this.expectElementToBeVisible(`${this.passwordInput}[aria-label], ${this.passwordInput}[aria-labelledby]`);
  }
} 