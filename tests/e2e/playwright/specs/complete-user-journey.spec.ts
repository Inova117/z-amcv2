import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { PlatformConnectionPage } from '../pages/PlatformConnectionPage';
import { CampaignBuilderPage } from '../pages/CampaignBuilderPage';
import { AssetManagerPage } from '../pages/AssetManagerPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';

test.describe('Complete User Journey', () => {
  let authPage: AuthPage;
  let platformPage: PlatformConnectionPage;
  let campaignPage: CampaignBuilderPage;
  let assetPage: AssetManagerPage;
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    platformPage = new PlatformConnectionPage(page);
    campaignPage = new CampaignBuilderPage(page);
    assetPage = new AssetManagerPage(page);
    analyticsPage = new AnalyticsPage(page);
  });

  test('Complete user journey: Sign up → Connect platforms → Create campaign → Upload assets → Deploy → View analytics', async () => {
    // Step 1: Sign Up
    await test.step('User signs up for new account', async () => {
      await authPage.goToSignUp();
      const credentials = await authPage.signUpWithValidData();
      await authPage.expectSuccessMessage('Account created successfully');
      await authPage.expectUrl('/onboarding');
    });

    // Step 2: Connect Platforms
    await test.step('User connects advertising platforms', async () => {
      await platformPage.goToPlatformConnections();
      
      // Connect Google Ads
      await platformPage.connectGoogleAds();
      await platformPage.expectPlatformConnected('Google Ads');
      
      // Connect Meta
      await platformPage.connectMeta();
      await platformPage.expectPlatformConnected('Meta');
      
      await platformPage.expectSuccessMessage('Platforms connected successfully');
    });

    // Step 3: Upload Assets
    await test.step('User uploads campaign assets', async () => {
      await assetPage.goToAssetManager();
      
      // Upload multiple assets
      await assetPage.uploadFile('campaign-banner.jpg');
      await assetPage.uploadFile('product-image.png');
      await assetPage.uploadFile('logo.svg');
      
      // Organize assets
      await assetPage.editAsset('campaign-banner.jpg', {
        tags: ['campaign-2024', 'banner', 'marketing'],
        description: 'Main campaign banner for product launch'
      });
      
      await assetPage.expectAssetExists('campaign-banner.jpg');
      await assetPage.expectAssetExists('product-image.png');
      await assetPage.expectAssetExists('logo.svg');
    });

    // Step 4: Create Campaign
    await test.step('User creates a new campaign', async () => {
      await campaignPage.goToCampaignBuilder();
      
      const campaignData = await campaignPage.createCompleteCampaign();
      await campaignPage.expectCampaignCreated();
      
      // Verify campaign appears in campaigns list
      await campaignPage.goto('/campaigns');
      await campaignPage.expectElementToContainText('[data-testid="campaign-list"]', campaignData.name);
    });

    // Step 5: Deploy Campaign
    await test.step('User deploys the campaign', async () => {
      // Navigate to campaign deployment
      await campaignPage.goto('/campaigns');
      await campaignPage.clickElement('[data-testid="deploy-campaign-button"]');
      
      // Confirm deployment
      await campaignPage.expectElementToBeVisible('[data-testid="deployment-confirmation-modal"]');
      await campaignPage.clickElement('[data-testid="confirm-deployment-button"]');
      
      // Wait for deployment to complete
      await campaignPage.waitForElementToBeHidden('[data-testid="deployment-progress"]');
      await campaignPage.expectSuccessMessage('Campaign deployed successfully');
      
      // Verify campaign status
      await campaignPage.expectElementToContainText('[data-testid="campaign-status"]', 'Active');
    });

    // Step 6: View Analytics
    await test.step('User views campaign analytics', async () => {
      await analyticsPage.goToAnalytics();
      
      // Verify analytics dashboard loads
      await analyticsPage.expectElementToBeVisible('[data-testid="dashboard-overview"]');
      
      // Check KPI metrics are displayed
      await analyticsPage.expectElementToBeVisible('[data-testid="kpi-impressions"]');
      await analyticsPage.expectElementToBeVisible('[data-testid="kpi-clicks"]');
      await analyticsPage.expectElementToBeVisible('[data-testid="kpi-conversions"]');
      
      // Verify performance chart
      await analyticsPage.expectElementToBeVisible('[data-testid="performance-chart"]');
      
      // Test data filtering
      await analyticsPage.selectDateRange('last-7-days');
      await analyticsPage.filterByPlatform('Google Ads');
      
      // Export analytics data
      await analyticsPage.exportData('csv');
      await analyticsPage.expectSuccessMessage('Export started');
    });
  });

  test.describe('Error Handling Throughout Journey', () => {
    test('should handle platform connection failures gracefully', async () => {
      // Sign up first
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      // Try to connect platform with failure
      await platformPage.goToPlatformConnections();
      await platformPage.testConnectionFailure('Google Ads');
      
      // User should be able to retry
      await platformPage.expectElementToBeVisible('[data-testid="retry-connection-button"]');
      await platformPage.clickElement('[data-testid="retry-connection-button"]');
    });

    test('should handle asset upload failures', async () => {
      // Complete auth and platform setup
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      // Try to upload invalid file
      await assetPage.goToAssetManager();
      await assetPage.testInvalidFileUpload();
      
      // Try to upload oversized file
      await assetPage.testFileSizeLimit();
    });

    test('should handle campaign creation failures', async () => {
      // Complete setup up to campaign creation
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      // Try to create campaign with missing data
      await campaignPage.goToCampaignBuilder();
      await campaignPage.testEmptyFormSubmission();
      
      // Try to create campaign with invalid budget
      await campaignPage.testInvalidBudgetValues();
    });

    test('should handle deployment failures', async () => {
      // Complete setup up to deployment
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      await campaignPage.goToCampaignBuilder();
      await campaignPage.createCompleteCampaign();
      
      // Mock deployment failure
      await campaignPage.mockApiCall('campaigns/deploy', { 
        error: 'Deployment failed' 
      }, 500);
      
      await campaignPage.goto('/campaigns');
      await campaignPage.clickElement('[data-testid="deploy-campaign-button"]');
      await campaignPage.clickElement('[data-testid="confirm-deployment-button"]');
      
      await campaignPage.expectErrorMessage('Deployment failed. Please try again.');
    });

    test('should handle analytics data loading failures', async () => {
      // Complete full journey
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      await campaignPage.goToCampaignBuilder();
      await campaignPage.createCompleteCampaign();
      
      // Mock analytics failure
      await analyticsPage.testDataLoadingFailure();
    });
  });

  test.describe('Empty States Throughout Journey', () => {
    test('should show appropriate empty states for new users', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      // No platforms connected
      await platformPage.goToPlatformConnections();
      await platformPage.expectNoPlatformsConnected();
      
      // No assets uploaded
      await assetPage.goToAssetManager();
      await assetPage.expectEmptyState();
      
      // No campaigns created
      await campaignPage.goto('/campaigns');
      await campaignPage.expectElementToBeVisible('[data-testid="campaigns-empty-state"]');
      
      // No analytics data
      await analyticsPage.goToAnalytics();
      await analyticsPage.expectNoDataState();
    });

    test('should provide helpful actions in empty states', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      // Test empty state actions
      await platformPage.goToPlatformConnections();
      await platformPage.testEmptyStateActions();
      
      await assetPage.goToAssetManager();
      await assetPage.testEmptyStateActions();
      
      await analyticsPage.goToAnalytics();
      await analyticsPage.testEmptyStateActions();
    });
  });

  test.describe('Edge Cases and Performance', () => {
    test('should handle concurrent operations', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      
      // Test concurrent platform connections
      await platformPage.testConcurrentConnections();
      
      await assetPage.goToAssetManager();
      
      // Test concurrent asset uploads
      await assetPage.testConcurrentUploads();
    });

    test('should handle large datasets', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      // Test large asset library
      await assetPage.goToAssetManager();
      await assetPage.testLargeAssetLibrary();
      
      // Test large analytics dataset
      await analyticsPage.goToAnalytics();
      await analyticsPage.testLargeDatasetHandling();
    });

    test('should maintain performance with complex campaigns', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      await platformPage.connectMeta();
      
      // Test complex audience configuration
      await campaignPage.goToCampaignBuilder();
      await campaignPage.testLargeAudienceConfiguration();
    });
  });

  test.describe('Accessibility Throughout Journey', () => {
    test('should support keyboard navigation across all pages', async () => {
      await authPage.goToSignUp();
      await authPage.testKeyboardNavigation();
      
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.testKeyboardNavigation();
      
      await assetPage.goToAssetManager();
      await assetPage.testKeyboardNavigation();
      
      await campaignPage.goToCampaignBuilder();
      await campaignPage.testKeyboardNavigation();
      
      await analyticsPage.goToAnalytics();
      await analyticsPage.testKeyboardNavigation();
    });

    test('should provide proper screen reader support', async () => {
      await authPage.goToSignUp();
      await authPage.testScreenReaderLabels();
      
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.testScreenReaderSupport();
      
      await assetPage.goToAssetManager();
      await assetPage.testScreenReaderSupport();
      
      await campaignPage.goToCampaignBuilder();
      await campaignPage.testScreenReaderSupport();
      
      await analyticsPage.goToAnalytics();
      await analyticsPage.testScreenReaderSupport();
    });
  });

  test.describe('Data Persistence and State Management', () => {
    test('should persist user progress across browser sessions', async () => {
      // Start journey
      await authPage.goToSignUp();
      const credentials = await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      // Simulate browser restart
      await authPage.page.context().clearCookies();
      await authPage.page.reload();
      
      // User should be redirected to login
      await authPage.expectUrl('/auth/signin');
      
      // Sign back in
      await authPage.signIn(credentials.email, credentials.password);
      
      // Platform connection should be preserved
      await platformPage.goToPlatformConnections();
      await platformPage.expectPlatformConnected('Google Ads');
    });

    test('should handle draft recovery', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      // Start creating campaign
      await campaignPage.goToCampaignBuilder();
      await campaignPage.fillCampaignBasics('Draft Campaign', 'Test draft', 'conversions');
      
      // Auto-save should trigger
      await campaignPage.testAutoDraftSave();
      
      // Navigate away and back
      await campaignPage.goto('/dashboard');
      await campaignPage.goToCampaignBuilder();
      
      // Should offer to restore draft
      await campaignPage.testDraftRecovery();
    });
  });

  test.describe('Integration and Real-time Features', () => {
    test('should handle real-time updates', async () => {
      await authPage.goToSignUp();
      await authPage.signUpWithValidData();
      
      await platformPage.goToPlatformConnections();
      await platformPage.connectGoogleAds();
      
      await campaignPage.goToCampaignBuilder();
      await campaignPage.createCompleteCampaign();
      
      // Deploy campaign
      await campaignPage.goto('/campaigns');
      await campaignPage.clickElement('[data-testid="deploy-campaign-button"]');
      await campaignPage.clickElement('[data-testid="confirm-deployment-button"]');
      
      // Test real-time analytics updates
      await analyticsPage.goToAnalytics();
      await analyticsPage.testRealTimeUpdates();
    });

    test('should sync data across multiple tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      const authPage1 = new AuthPage(page1);
      const authPage2 = new AuthPage(page2);
      const analyticsPage1 = new AnalyticsPage(page1);
      const analyticsPage2 = new AnalyticsPage(page2);
      
      // Sign in on both tabs
      await authPage1.goToSignIn();
      await authPage1.signInWithValidCredentials();
      
      await authPage2.goToSignIn();
      await authPage2.signInWithValidCredentials();
      
      // Open analytics on both tabs
      await analyticsPage1.goToAnalytics();
      await analyticsPage2.goToAnalytics();
      
      // Refresh data on tab 1
      await analyticsPage1.refreshData();
      
      // Tab 2 should also update
      await analyticsPage2.expectElementToBeVisible('[data-testid="data-sync-indicator"]');
      
      await context.close();
    });
  });
}); 