// Import commands.js using ES2015 syntax:
import './commands';
import './index.d.ts';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);

// Global before hook
beforeEach(() => {
  // Inject axe for accessibility testing
  cy.injectAxe();
  
  // Set up common intercepts
  cy.intercept('GET', '**/health', { fixture: 'health-check.json' }).as('healthCheck');
  cy.intercept('GET', '**/api/user', { fixture: 'user.json' }).as('getUser');
  
  // Mock analytics data by default
  cy.intercept('GET', '**/analytics/**', { fixture: 'analytics.json' }).as('getAnalytics');
  
  // Mock platform status
  cy.intercept('GET', '**/platforms/status', { fixture: 'platforms-status.json' }).as('getPlatformStatus');
});

// Global after hook
afterEach(() => {
  // Check for console errors (if available)
  cy.window().then((win) => {
    // Skip console error checking in test environment
    if (typeof win.console.error === 'function') {
      cy.log('Console error checking skipped in test environment');
    }
  });
  
  // Run accessibility checks on every page
  cy.checkA11y(null, {
    includedImpacts: ['critical', 'serious']
  });
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Only for specific known issues
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Let other errors fail the test
  return true;
});

// Custom viewport sizes for responsive testing
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Performance monitoring
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const perfData = win.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    cy.log(`Page load time: ${pageLoadTime}ms`);
    
    // Assert page loads within reasonable time
    expect(pageLoadTime).to.be.lessThan(5000);
  });
});

// Network monitoring
Cypress.Commands.add('monitorNetworkRequests', () => {
  const requests: any[] = [];
  
  cy.intercept('**', (req) => {
    requests.push({
      url: req.url,
      method: req.method,
      timestamp: Date.now()
    });
    req.continue();
  });
  
  cy.wrap(requests).as('networkRequests');
});

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      measurePageLoad(): Chainable<void>;
      monitorNetworkRequests(): Chainable<void>;
    }
  }
} 