/// <reference types="cypress" />

// Authentication commands
Cypress.Commands.add('signUp', (email: string, password: string, confirmPassword?: string) => {
  cy.visit('/auth/signup');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  
  if (confirmPassword) {
    cy.get('[data-testid="confirm-password-input"]').type(confirmPassword);
  }
  
  cy.get('[data-testid="signup-button"]').click();
});

Cypress.Commands.add('signIn', (email: string, password: string) => {
  cy.visit('/auth/signin');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="signin-button"]').click();
});

Cypress.Commands.add('signOut', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="sign-out-button"]').click();
});

// Platform connection commands
Cypress.Commands.add('connectPlatform', (platform: string) => {
  cy.visit('/settings/platforms');
  cy.get(`[data-testid="connect-${platform.toLowerCase().replace(' ', '-')}"]`).click();
  
  // Mock OAuth success
  cy.window().then((win) => {
    win.postMessage({ type: 'oauth_success', platform }, '*');
  });
  
  cy.get(`[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"] [data-testid="connected-status"]`)
    .should('be.visible');
});

// Campaign creation commands
Cypress.Commands.add('createCampaign', (campaignData: {
  name: string;
  description: string;
  objective: string;
  budget: string;
  platforms: string[];
}) => {
  cy.visit('/campaigns/create');
  
  // Fill basic information
  cy.get('[data-testid="campaign-name-input"]').type(campaignData.name);
  cy.get('[data-testid="campaign-description-input"]').type(campaignData.description);
  cy.get('[data-testid="campaign-objective-select"]').select(campaignData.objective);
  cy.get('[data-testid="budget-input"]').type(campaignData.budget);
  
  // Select platforms
  campaignData.platforms.forEach(platform => {
    cy.get(`[data-testid="platform-${platform.toLowerCase()}"]`).click();
  });
  
  cy.get('[data-testid="create-campaign-button"]').click();
});

// Asset management commands
Cypress.Commands.add('uploadAsset', (fileName: string) => {
  cy.visit('/assets');
  cy.get('[data-testid="file-input"]').selectFile(`cypress/fixtures/assets/${fileName}`);
  cy.get('[data-testid="upload-progress"]').should('not.exist');
  cy.contains('File uploaded successfully').should('be.visible');
});

// Analytics commands
Cypress.Commands.add('viewAnalytics', (filters?: {
  dateRange?: string;
  campaign?: string;
  platform?: string;
}) => {
  cy.visit('/analytics');
  
  if (filters?.dateRange) {
    cy.get('[data-testid="date-range-selector"]').select(filters.dateRange);
  }
  
  if (filters?.campaign) {
    cy.get('[data-testid="campaign-filter"]').select(filters.campaign);
  }
  
  if (filters?.platform) {
    cy.get('[data-testid="platform-filter"]').select(filters.platform);
  }
  
  cy.get('[data-testid="dashboard-overview"]').should('be.visible');
});

// Utility commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
  cy.get('body').should('be.visible');
});

Cypress.Commands.add('expectToast', (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`).should('contain.text', message);
});

Cypress.Commands.add('expectValidationError', (field: string, message: string) => {
  cy.get(`[data-testid="${field}-error"]`).should('contain.text', message);
});

Cypress.Commands.add('mockApiResponse', (url: string, response: any, statusCode: number = 200) => {
  cy.intercept('**' + url, {
    statusCode,
    body: response
  }).as(`mock-${url.replace(/[^a-zA-Z0-9]/g, '-')}`);
});

// Form helpers
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(value);
  });
});

Cypress.Commands.add('submitForm', (formSelector: string = 'form') => {
  cy.get(`${formSelector} button[type="submit"]`).click();
});

// Navigation helpers
Cypress.Commands.add('navigateTo', (page: string) => {
  const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'campaigns': '/campaigns',
    'assets': '/assets',
    'analytics': '/analytics',
    'settings': '/settings',
    'platforms': '/settings/platforms'
  };
  
  cy.visit(routes[page] || page);
});

// Accessibility helpers
Cypress.Commands.add('testKeyboardNavigation', (selectors: string[]) => {
  selectors.forEach((selector, index) => {
    if (index === 0) {
      cy.get(selector).focus();
    } else {
      cy.focused().type('{tab}');
      cy.focused().should('match', selector);
    }
  });
});

Cypress.Commands.add('testScreenReader', (selector: string) => {
  cy.get(selector).should('satisfy', (el) => {
    return el.attr('aria-label') || el.attr('aria-labelledby') || el.attr('aria-describedby');
  });
});

// Performance helpers
Cypress.Commands.add('measurePerformance', (metricName: string) => {
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const metric = perfData.loadEventEnd - perfData.fetchStart;
    cy.log(`${metricName}: ${metric}ms`);
    
    // Store metric for reporting
    cy.task('recordMetric', { name: metricName, value: metric });
  });
});

// Error handling
Cypress.Commands.add('expectError', (message: string) => {
  cy.get('[role="alert"], .error-message, .alert-destructive')
    .should('be.visible')
    .and('contain.text', message);
});

Cypress.Commands.add('expectSuccess', (message: string) => {
  cy.get('.success-message, .alert-success, .toast')
    .should('be.visible')
    .and('contain.text', message);
});

// Responsive testing
Cypress.Commands.add('testResponsive', (callback: () => void) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    callback();
  });
});

// Data generation helpers
Cypress.Commands.add('generateTestData', (type: 'user' | 'campaign' | 'asset') => {
  const timestamp = Date.now();
  
  let data: any;
  
  switch (type) {
    case 'user':
      data = {
        email: `test+${timestamp}@example.com`,
        password: 'TestPassword123!',
        name: `Test User ${timestamp}`
      };
      break;
    case 'campaign':
      data = {
        name: `Test Campaign ${timestamp}`,
        description: 'Automated test campaign',
        objective: 'conversions',
        budget: '1000',
        platforms: ['google-ads']
      };
      break;
    case 'asset':
      data = {
        name: `test-asset-${timestamp}.jpg`,
        type: 'image',
        tags: ['test', 'automation']
      };
      break;
    default:
      data = {};
  }
  
  return cy.wrap(data);
});

// TypeScript declarations are in index.d.ts 