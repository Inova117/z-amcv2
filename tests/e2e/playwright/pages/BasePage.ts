import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation methods
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // Common element interactions
  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  // Wait for elements
  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForElementToBeHidden(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  // Assertions
  async expectElementToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementToBeHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectElementToContainText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectUrl(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  // Error handling
  async expectErrorMessage(message: string) {
    const errorSelector = '[role="alert"], .error-message, .alert-destructive';
    await this.waitForElement(errorSelector);
    await this.expectElementToContainText(errorSelector, message);
  }

  async expectSuccessMessage(message: string) {
    const successSelector = '.success-message, .alert-success, .toast';
    await this.waitForElement(successSelector);
    await this.expectElementToContainText(successSelector, message);
  }

  // Loading states
  async waitForLoadingToFinish() {
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.animate-spin'
    ];
    
    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout: 1000 });
      } catch {
        // Selector not found, continue
      }
    }
  }

  // Form helpers
  async submitForm(formSelector: string = 'form') {
    await this.page.click(`${formSelector} button[type="submit"]`);
  }

  async expectFormValidationError(fieldName: string, errorMessage: string) {
    const errorSelector = `[data-testid="${fieldName}-error"], .field-error`;
    await this.waitForElement(errorSelector);
    await this.expectElementToContainText(errorSelector, errorMessage);
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }

  // Network helpers
  async waitForApiCall(url: string, method: string = 'GET') {
    return this.page.waitForResponse(response => 
      response.url().includes(url) && response.request().method() === method
    );
  }

  async mockApiCall(url: string, response: any, status: number = 200) {
    await this.page.route(`**/${url}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
} 