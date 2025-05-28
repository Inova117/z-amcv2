import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlatformConnectionPage extends BasePage {
  // Selectors
  private readonly connectPlatformButton = '[data-testid="connect-platform-button"]';
  private readonly googleAdsCard = '[data-testid="google-ads-card"]';
  private readonly metaCard = '[data-testid="meta-card"]';
  private readonly tiktokCard = '[data-testid="tiktok-card"]';
  private readonly linkedinCard = '[data-testid="linkedin-card"]';
  private readonly twitterCard = '[data-testid="twitter-card"]';
  
  // Connection buttons
  private readonly connectGoogleAdsButton = '[data-testid="connect-google-ads"]';
  private readonly connectMetaButton = '[data-testid="connect-meta"]';
  private readonly connectTiktokButton = '[data-testid="connect-tiktok"]';
  private readonly connectLinkedinButton = '[data-testid="connect-linkedin"]';
  private readonly connectTwitterButton = '[data-testid="connect-twitter"]';
  
  // Status indicators
  private readonly connectedStatus = '[data-testid="connected-status"]';
  private readonly disconnectedStatus = '[data-testid="disconnected-status"]';
  private readonly connectingStatus = '[data-testid="connecting-status"]';
  private readonly errorStatus = '[data-testid="error-status"]';
  
  // Disconnect buttons
  private readonly disconnectButton = '[data-testid="disconnect-button"]';
  private readonly confirmDisconnectButton = '[data-testid="confirm-disconnect"]';
  private readonly cancelDisconnectButton = '[data-testid="cancel-disconnect"]';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goToPlatformConnections() {
    await this.goto('/settings/platforms');
  }

  // Platform Connection Methods
  async connectGoogleAds() {
    await this.clickElement(this.connectGoogleAdsButton);
    await this.handleOAuthFlow('Google Ads');
  }

  async connectMeta() {
    await this.clickElement(this.connectMetaButton);
    await this.handleOAuthFlow('Meta');
  }

  async connectTiktok() {
    await this.clickElement(this.connectTiktokButton);
    await this.handleOAuthFlow('TikTok');
  }

  async connectLinkedin() {
    await this.clickElement(this.connectLinkedinButton);
    await this.handleOAuthFlow('LinkedIn');
  }

  async connectTwitter() {
    await this.clickElement(this.connectTwitterButton);
    await this.handleOAuthFlow('Twitter');
  }

  // OAuth Flow Handler
  private async handleOAuthFlow(platform: string) {
    // Wait for OAuth popup or redirect
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      // OAuth flow would normally open a popup
    ]);

    if (popup) {
      // Handle OAuth in popup
      await popup.waitForLoadState();
      
      // Mock OAuth success
      await popup.evaluate(() => {
        window.postMessage({ type: 'oauth_success', platform: 'google-ads' }, '*');
      });
      
      await popup.close();
    }

    // Wait for connection to complete
    await this.waitForConnectionComplete(platform);
  }

  private async waitForConnectionComplete(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.waitForElement(`${platformCard} ${this.connectedStatus}`);
  }

  // Disconnection Methods
  async disconnectPlatform(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.clickElement(`${platformCard} ${this.disconnectButton}`);
    await this.clickElement(this.confirmDisconnectButton);
  }

  async cancelDisconnection() {
    await this.clickElement(this.cancelDisconnectButton);
  }

  // Status Verification
  async expectPlatformConnected(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.expectElementToBeVisible(`${platformCard} ${this.connectedStatus}`);
    await this.expectElementToContainText(`${platformCard}`, 'Connected');
  }

  async expectPlatformDisconnected(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.expectElementToBeVisible(`${platformCard} ${this.disconnectedStatus}`);
    await this.expectElementToContainText(`${platformCard}`, 'Not Connected');
  }

  async expectPlatformConnecting(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.expectElementToBeVisible(`${platformCard} ${this.connectingStatus}`);
    await this.expectElementToContainText(`${platformCard}`, 'Connecting...');
  }

  async expectPlatformError(platform: string) {
    const platformCard = `[data-testid="${platform.toLowerCase().replace(' ', '-')}-card"]`;
    await this.expectElementToBeVisible(`${platformCard} ${this.errorStatus}`);
    await this.expectElementToContainText(`${platformCard}`, 'Connection Failed');
  }

  // Empty State Tests
  async expectNoPlatformsConnected() {
    await this.expectElementToContainText('[data-testid="platforms-empty-state"]', 'No platforms connected');
    await this.expectElementToContainText('[data-testid="platforms-empty-state"]', 'Connect your first platform to get started');
  }

  async testEmptyStateActions() {
    await this.expectElementToBeVisible('[data-testid="connect-first-platform-button"]');
    await this.clickElement('[data-testid="connect-first-platform-button"]');
    await this.expectElementToBeVisible('[data-testid="platform-selection-modal"]');
  }

  // Error State Tests
  async testConnectionFailure(platform: string) {
    // Mock connection failure
    await this.mockApiCall(`platforms/${platform}/connect`, { error: 'Connection failed' }, 400);
    
    const connectButton = `[data-testid="connect-${platform.toLowerCase().replace(' ', '-')}"]`;
    await this.clickElement(connectButton);
    
    await this.expectPlatformError(platform);
    await this.expectErrorMessage('Failed to connect to platform');
  }

  async testNetworkTimeout(platform: string) {
    // Mock slow network
    await this.page.route(`**/platforms/${platform}/connect`, async route => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request timeout' })
      });
    });

    const connectButton = `[data-testid="connect-${platform.toLowerCase().replace(' ', '-')}"]`;
    await this.clickElement(connectButton);
    
    await this.expectPlatformConnecting(platform);
    await this.expectErrorMessage('Connection timed out');
  }

  async testOAuthCancellation(platform: string) {
    const connectButton = `[data-testid="connect-${platform.toLowerCase().replace(' ', '-')}"]`;
    await this.clickElement(connectButton);

    // Simulate OAuth cancellation
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
    ]);

    if (popup) {
      await popup.close(); // User closes OAuth popup
    }

    await this.expectPlatformDisconnected(platform);
    await this.expectErrorMessage('Authentication was cancelled');
  }

  // Edge Cases
  async testMultiplePlatformConnections() {
    const platforms = ['Google Ads', 'Meta', 'TikTok'];
    
    for (const platform of platforms) {
      await this.connectPlatform(platform);
      await this.expectPlatformConnected(platform);
    }
    
    // Verify all platforms are connected
    for (const platform of platforms) {
      await this.expectPlatformConnected(platform);
    }
  }

  private async connectPlatform(platform: string) {
    switch (platform) {
      case 'Google Ads':
        await this.connectGoogleAds();
        break;
      case 'Meta':
        await this.connectMeta();
        break;
      case 'TikTok':
        await this.connectTiktok();
        break;
      case 'LinkedIn':
        await this.connectLinkedin();
        break;
      case 'Twitter':
        await this.connectTwitter();
        break;
    }
  }

  async testReconnectionFlow(platform: string) {
    // First connect
    await this.connectPlatform(platform);
    await this.expectPlatformConnected(platform);
    
    // Then disconnect
    await this.disconnectPlatform(platform);
    await this.expectPlatformDisconnected(platform);
    
    // Reconnect
    await this.connectPlatform(platform);
    await this.expectPlatformConnected(platform);
  }

  async testConcurrentConnections() {
    // Try to connect multiple platforms simultaneously
    const connectPromises = [
      this.clickElement(this.connectGoogleAdsButton),
      this.clickElement(this.connectMetaButton),
      this.clickElement(this.connectTiktokButton),
    ];

    await Promise.all(connectPromises);
    
    // Should handle concurrent connections gracefully
    await this.expectElementToBeVisible('[data-testid="connection-queue-message"]');
  }

  // Permission Tests
  async testInsufficientPermissions(platform: string) {
    // Mock insufficient permissions response
    await this.mockApiCall(`platforms/${platform}/connect`, { 
      error: 'Insufficient permissions',
      required_permissions: ['ads_management', 'read_insights']
    }, 403);
    
    const connectButton = `[data-testid="connect-${platform.toLowerCase().replace(' ', '-')}"]`;
    await this.clickElement(connectButton);
    
    await this.expectErrorMessage('Insufficient permissions');
    await this.expectElementToBeVisible('[data-testid="permissions-help-link"]');
  }

  // Account Selection Tests
  async testMultipleAccountSelection(platform: string) {
    // Mock multiple accounts response
    await this.mockApiCall(`platforms/${platform}/accounts`, {
      accounts: [
        { id: '1', name: 'Account 1', type: 'business' },
        { id: '2', name: 'Account 2', type: 'personal' },
        { id: '3', name: 'Account 3', type: 'business' },
      ]
    });

    await this.connectPlatform(platform);
    
    // Should show account selection modal
    await this.expectElementToBeVisible('[data-testid="account-selection-modal"]');
    await this.expectElementToContainText('[data-testid="account-selection-modal"]', 'Select Account');
    
    // Select first account
    await this.clickElement('[data-testid="account-option-1"]');
    await this.clickElement('[data-testid="confirm-account-selection"]');
    
    await this.expectPlatformConnected(platform);
  }

  // Data Validation Tests
  async testConnectionDataValidation() {
    // Test that connection stores correct data
    await this.connectGoogleAds();
    
    // Verify connection data is displayed
    await this.expectElementToBeVisible('[data-testid="google-ads-account-info"]');
    await this.expectElementToContainText('[data-testid="google-ads-account-info"]', 'Account ID:');
    await this.expectElementToContainText('[data-testid="google-ads-account-info"]', 'Connected on:');
  }

  // Accessibility Tests
  async testKeyboardNavigation() {
    await this.page.keyboard.press('Tab'); // First platform card
    await this.page.keyboard.press('Enter'); // Should open connection modal
    
    await this.expectElementToBeVisible('[data-testid="platform-connection-modal"]');
    
    await this.page.keyboard.press('Escape'); // Should close modal
    await this.expectElementToBeHidden('[data-testid="platform-connection-modal"]');
  }

  async testScreenReaderSupport() {
    // Check ARIA labels and descriptions
    await this.expectElementToBeVisible('[data-testid="google-ads-card"][aria-label]');
    await this.expectElementToBeVisible('[data-testid="connect-google-ads"][aria-describedby]');
  }
} 