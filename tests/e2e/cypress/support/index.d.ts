/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      signUp(email: string, password: string, confirmPassword?: string): Chainable<void>;
      signIn(email: string, password: string): Chainable<void>;
      signOut(): Chainable<void>;
      
      // Platform connection commands
      connectPlatform(platform: string): Chainable<void>;
      
      // Campaign creation commands
      createCampaign(campaignData: {
        name: string;
        description: string;
        objective: string;
        budget: string;
        platforms: string[];
      }): Chainable<void>;
      
      // Asset management commands
      uploadAsset(fileName: string): Chainable<void>;
      
      // Analytics commands
      viewAnalytics(filters?: {
        dateRange?: string;
        campaign?: string;
        platform?: string;
      }): Chainable<void>;
      
      // Utility commands
      waitForPageLoad(): Chainable<void>;
      expectToast(message: string, type?: 'success' | 'error' | 'warning'): Chainable<void>;
      expectValidationError(field: string, message: string): Chainable<void>;
      mockApiResponse(url: string, response: any, statusCode?: number): Chainable<void>;
      
      // Form helpers
      fillForm(formData: Record<string, string>): Chainable<void>;
      submitForm(formSelector?: string): Chainable<void>;
      
      // Navigation helpers
      navigateTo(page: string): Chainable<void>;
      
      // Accessibility helpers
      testKeyboardNavigation(selectors: string[]): Chainable<void>;
      testScreenReader(selector: string): Chainable<void>;
      
      // Performance helpers
      measurePerformance(metricName: string): Chainable<void>;
      
      // Error handling
      expectError(message: string): Chainable<void>;
      expectSuccess(message: string): Chainable<void>;
      
      // Responsive testing
      testResponsive(callback: () => void): Chainable<void>;
      
      // Data generation helpers
      generateTestData(type: 'user' | 'campaign' | 'asset'): Chainable<any>;
      
      // Viewport commands
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      
      // Performance monitoring
      measurePageLoad(): Chainable<void>;
      monitorNetworkRequests(): Chainable<void>;
    }
  }
}

export {}; 