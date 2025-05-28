describe('ZAMC Complete User Journey', () => {
  // Generate unique test data for each test run
  const timestamp = Date.now();
  const testUser = {
    email: `test+${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };

  const testCampaign = {
    name: `Test Campaign ${timestamp}`,
    description: 'Automated test campaign',
    objective: 'conversions',
    budget: '1000',
    platforms: ['google-ads']
  };

  beforeEach(() => {
    // Set up test environment
    cy.visit('/');
    cy.waitForPageLoad();
  });

  describe('Happy Path: Complete User Journey', () => {
    it('should complete the full user journey from sign up to analytics', () => {
      // Step 1: Sign Up
      cy.log('🔐 Step 1: User Registration');
      cy.signUp(testUser.email, testUser.password, testUser.password);
      cy.expectSuccess('Account created successfully');
      cy.url().should('include', '/onboarding');

      // Step 2: Connect Platforms
      cy.log('🔗 Step 2: Platform Connection');
      cy.connectPlatform('google-ads');
      cy.expectSuccess('Platform connected successfully');
      
      cy.connectPlatform('meta');
      cy.expectSuccess('Platform connected successfully');

      // Step 3: Upload Assets
      cy.log('📁 Step 3: Asset Management');
      cy.uploadAsset('test-image.jpg');
      
      // Step 4: Create Campaign
      cy.log('🎯 Step 4: Campaign Creation');
      cy.createCampaign(testCampaign);
      cy.expectSuccess('Campaign created successfully');
      cy.url().should('include', '/campaigns');

      // Step 5: Deploy Campaign
      cy.log('🚀 Step 5: Campaign Deployment');
      cy.get('[data-testid="deploy-campaign-button"]').click();
      cy.get('[data-testid="deployment-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-deployment-button"]').click();
      
      cy.get('[data-testid="deployment-progress"]').should('not.exist');
      cy.expectSuccess('Campaign deployed successfully');
      cy.get('[data-testid="campaign-status"]').should('contain.text', 'Active');

      // Step 6: View Analytics
      cy.log('📊 Step 6: Analytics Dashboard');
      cy.viewAnalytics({
        dateRange: 'last-7-days',
        platform: 'google-ads'
      });
      
      // Verify analytics components
      cy.get('[data-testid="kpi-impressions"]').should('be.visible');
      cy.get('[data-testid="kpi-clicks"]').should('be.visible');
      cy.get('[data-testid="kpi-conversions"]').should('be.visible');
      cy.get('[data-testid="performance-chart"]').should('be.visible');
      
      // Export data
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="export-csv"]').click();
      cy.expectSuccess('Export started');

      cy.log('✅ Complete user journey test passed!');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication errors gracefully', () => {
      // Test invalid email format
      cy.signUp('invalid-email', 'Password123!', 'Password123!');
      cy.expectValidationError('email', 'Please enter a valid email address');
      
      // Test password mismatch
      cy.signUp('test@example.com', 'Password123!', 'DifferentPassword');
      cy.expectValidationError('confirm-password', 'Passwords do not match');
      
      // Test weak password
      cy.signUp('test@example.com', '123', '123');
      cy.expectValidationError('password', 'Password must be at least 8 characters');
    });

    it('should handle platform connection failures', () => {
      // Sign up first
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // Mock connection failure
      cy.mockApiResponse('/platforms/google-ads/connect', { 
        error: 'Connection failed' 
      }, 400);
      
      cy.visit('/settings/platforms');
      cy.get('[data-testid="connect-google-ads"]').click();
      cy.expectError('Failed to connect to platform');
    });

    it('should handle asset upload failures', () => {
      // Complete auth setup
      cy.signUp(testUser.email, testUser.password, testUser.password);
      cy.connectPlatform('google-ads');
      
      // Mock upload failure
      cy.mockApiResponse('/assets/upload', { 
        error: 'File too large' 
      }, 413);
      
      cy.visit('/assets');
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/assets/test-image.jpg');
      cy.expectError('File size exceeds the maximum limit');
    });

    it('should handle campaign creation failures', () => {
      // Setup user and platforms
      cy.signUp(testUser.email, testUser.password, testUser.password);
      cy.connectPlatform('google-ads');
      
      // Test empty form submission
      cy.visit('/campaigns/create');
      cy.get('[data-testid="create-campaign-button"]').click();
      
      cy.expectValidationError('campaign-name', 'Campaign name is required');
      cy.expectValidationError('campaign-objective', 'Campaign objective is required');
      cy.expectValidationError('budget', 'Budget is required');
    });

    it('should handle deployment failures', () => {
      // Complete setup
      cy.signUp(testUser.email, testUser.password, testUser.password);
      cy.connectPlatform('google-ads');
      cy.createCampaign(testCampaign);
      
      // Mock deployment failure
      cy.mockApiResponse('/campaigns/deploy', { 
        error: 'Deployment failed' 
      }, 500);
      
      cy.get('[data-testid="deploy-campaign-button"]').click();
      cy.get('[data-testid="confirm-deployment-button"]').click();
      cy.expectError('Deployment failed. Please try again.');
    });

    it('should handle analytics loading failures', () => {
      // Complete setup
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // Mock analytics failure
      cy.mockApiResponse('/analytics/dashboard', { 
        error: 'Data loading failed' 
      }, 500);
      
      cy.visit('/analytics');
      cy.expectError('Failed to load analytics data');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Empty States', () => {
    it('should show appropriate empty states for new users', () => {
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // No platforms connected
      cy.visit('/settings/platforms');
      cy.get('[data-testid="platforms-empty-state"]').should('be.visible');
      cy.get('[data-testid="platforms-empty-state"]')
        .should('contain.text', 'No platforms connected');
      
      // No assets uploaded
      cy.visit('/assets');
      cy.get('[data-testid="assets-empty-state"]').should('be.visible');
      cy.get('[data-testid="assets-empty-state"]')
        .should('contain.text', 'No assets found');
      
      // No campaigns created
      cy.visit('/campaigns');
      cy.get('[data-testid="campaigns-empty-state"]').should('be.visible');
      cy.get('[data-testid="campaigns-empty-state"]')
        .should('contain.text', 'No campaigns found');
      
      // No analytics data
      cy.visit('/analytics');
      cy.get('[data-testid="no-data-state"]').should('be.visible');
      cy.get('[data-testid="no-data-state"]')
        .should('contain.text', 'No data available');
    });
  });

  describe('Accessibility Testing', () => {
    it('should meet accessibility standards across all pages', () => {
      // Test auth pages first (no login required)
      cy.visit('/auth/signup');
      cy.checkA11y();
      
      cy.visit('/auth/signin');
      cy.checkA11y();
      
      // Complete signup for authenticated pages
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // Test main application pages
      cy.visit('/dashboard');
      cy.checkA11y();
      
      cy.visit('/campaigns');
      cy.checkA11y();
      
      cy.visit('/assets');
      cy.checkA11y();
      
      cy.visit('/analytics');
      cy.checkA11y();
      
      cy.visit('/settings/platforms');
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      cy.visit('/dashboard');
      cy.testKeyboardNavigation([
        '[data-testid="main-nav"]',
        '[data-testid="dashboard-overview"]',
        '[data-testid="quick-actions"]'
      ]);
    });

    it('should support screen readers', () => {
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      cy.visit('/campaigns');
      cy.testScreenReader('[data-testid="campaigns-table"]');
      cy.testScreenReader('[data-testid="create-campaign-button"]');
      
      cy.visit('/analytics');
      cy.testScreenReader('[data-testid="performance-chart"]');
      cy.testScreenReader('[data-testid="kpi-cards"]');
    });
  });

  describe('Performance Testing', () => {
    it('should load pages within acceptable time limits', () => {
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // Test page load performance
      cy.visit('/dashboard');
      cy.measurePageLoad();
      cy.measurePerformance('Dashboard Load Time');
      
      cy.visit('/campaigns');
      cy.measurePageLoad();
      cy.measurePerformance('Campaigns Load Time');
      
      cy.visit('/analytics');
      cy.measurePageLoad();
      cy.measurePerformance('Analytics Load Time');
    });

    it('should handle large datasets efficiently', () => {
      cy.signUp(testUser.email, testUser.password, testUser.password);
      
      // Mock large dataset
      cy.mockApiResponse('/analytics/dashboard', {
        campaigns: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `Campaign ${i + 1}`,
          impressions: Math.floor(Math.random() * 100000),
          clicks: Math.floor(Math.random() * 5000)
        }))
      });
      
      cy.visit('/analytics');
      cy.measurePerformance('Large Dataset Load Time');
      cy.get('[data-testid="campaigns-table"]').should('be.visible');
    });
  });

  describe('Responsive Design Testing', () => {
    it('should work correctly on different screen sizes', () => {
      cy.testResponsive(() => {
        cy.signUp(testUser.email, testUser.password, testUser.password);
        
        // Test main navigation
        cy.get('[data-testid="main-nav"]').should('be.visible');
        
        // Test dashboard layout
        cy.visit('/dashboard');
        cy.get('[data-testid="dashboard-overview"]').should('be.visible');
        
        // Test campaigns page
        cy.visit('/campaigns');
        cy.get('[data-testid="campaigns-header"]').should('be.visible');
      });
    });
  });

  describe('Network Monitoring', () => {
    it('should track network requests and performance', () => {
      cy.monitorNetworkRequests();
      
      cy.signUp(testUser.email, testUser.password, testUser.password);
      cy.visit('/dashboard');
      
      cy.get('@networkRequests').should('have.length.greaterThan', 0);
    });
  });
}); 