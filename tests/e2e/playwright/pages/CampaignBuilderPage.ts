import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CampaignBuilderPage extends BasePage {
  // Selectors
  private readonly campaignNameInput = '[data-testid="campaign-name-input"]';
  private readonly campaignDescriptionInput = '[data-testid="campaign-description-input"]';
  private readonly campaignObjectiveSelect = '[data-testid="campaign-objective-select"]';
  private readonly budgetInput = '[data-testid="budget-input"]';
  private readonly budgetTypeSelect = '[data-testid="budget-type-select"]';
  private readonly startDateInput = '[data-testid="start-date-input"]';
  private readonly endDateInput = '[data-testid="end-date-input"]';
  private readonly targetAudienceSection = '[data-testid="target-audience-section"]';
  private readonly ageRangeSelect = '[data-testid="age-range-select"]';
  private readonly genderSelect = '[data-testid="gender-select"]';
  private readonly locationInput = '[data-testid="location-input"]';
  private readonly interestsInput = '[data-testid="interests-input"]';
  private readonly platformSelection = '[data-testid="platform-selection"]';
  private readonly createCampaignButton = '[data-testid="create-campaign-button"]';
  private readonly saveDraftButton = '[data-testid="save-draft-button"]';
  private readonly previewCampaignButton = '[data-testid="preview-campaign-button"]';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goToCampaignBuilder() {
    await this.goto('/campaigns/create');
  }

  // Basic Campaign Information
  async fillCampaignBasics(name: string, description: string, objective: string) {
    await this.fillInput(this.campaignNameInput, name);
    await this.fillInput(this.campaignDescriptionInput, description);
    await this.selectOption(this.campaignObjectiveSelect, objective);
  }

  async setCampaignBudget(amount: string, type: 'daily' | 'total') {
    await this.fillInput(this.budgetInput, amount);
    await this.selectOption(this.budgetTypeSelect, type);
  }

  async setCampaignDates(startDate: string, endDate?: string) {
    await this.fillInput(this.startDateInput, startDate);
    if (endDate) {
      await this.fillInput(this.endDateInput, endDate);
    }
  }

  // Target Audience Configuration
  async configureTargetAudience(config: {
    ageRange?: string;
    gender?: string;
    locations?: string[];
    interests?: string[];
  }) {
    if (config.ageRange) {
      await this.selectOption(this.ageRangeSelect, config.ageRange);
    }
    
    if (config.gender) {
      await this.selectOption(this.genderSelect, config.gender);
    }
    
    if (config.locations) {
      for (const location of config.locations) {
        await this.fillInput(this.locationInput, location);
        await this.page.keyboard.press('Enter');
      }
    }
    
    if (config.interests) {
      for (const interest of config.interests) {
        await this.fillInput(this.interestsInput, interest);
        await this.page.keyboard.press('Enter');
      }
    }
  }

  // Platform Selection
  async selectPlatforms(platforms: string[]) {
    for (const platform of platforms) {
      await this.clickElement(`[data-testid="platform-${platform.toLowerCase()}"]`);
    }
  }

  // Campaign Actions
  async createCampaign() {
    await this.clickElement(this.createCampaignButton);
    await this.waitForApiCall('campaigns', 'POST');
  }

  async saveDraft() {
    await this.clickElement(this.saveDraftButton);
    await this.waitForApiCall('campaigns/draft', 'POST');
  }

  async previewCampaign() {
    await this.clickElement(this.previewCampaignButton);
    await this.expectElementToBeVisible('[data-testid="campaign-preview-modal"]');
  }

  // Complete Campaign Creation Flow
  async createCompleteCampaign() {
    const campaignData = {
      name: `Test Campaign ${Date.now()}`,
      description: 'Automated test campaign',
      objective: 'conversions',
      budget: '1000',
      budgetType: 'daily' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      audience: {
        ageRange: '25-34',
        gender: 'all',
        locations: ['United States', 'Canada'],
        interests: ['Technology', 'Marketing']
      },
      platforms: ['Google Ads', 'Meta']
    };

    await this.fillCampaignBasics(campaignData.name, campaignData.description, campaignData.objective);
    await this.setCampaignBudget(campaignData.budget, campaignData.budgetType);
    await this.setCampaignDates(campaignData.startDate, campaignData.endDate);
    await this.configureTargetAudience(campaignData.audience);
    await this.selectPlatforms(campaignData.platforms);
    await this.createCampaign();

    return campaignData;
  }

  // Validation and Error States
  async expectCampaignCreated() {
    await this.expectSuccessMessage('Campaign created successfully');
    await this.expectUrl('/campaigns');
  }

  async expectDraftSaved() {
    await this.expectSuccessMessage('Draft saved');
  }

  async expectValidationError(field: string, message: string) {
    await this.expectFormValidationError(field, message);
  }

  // Empty State Tests
  async testEmptyFormSubmission() {
    await this.clickElement(this.createCampaignButton);
    
    await this.expectValidationError('campaign-name', 'Campaign name is required');
    await this.expectValidationError('campaign-objective', 'Campaign objective is required');
    await this.expectValidationError('budget', 'Budget is required');
  }

  async testPartialFormSubmission() {
    await this.fillInput(this.campaignNameInput, 'Test Campaign');
    await this.clickElement(this.createCampaignButton);
    
    await this.expectValidationError('campaign-objective', 'Campaign objective is required');
    await this.expectValidationError('budget', 'Budget is required');
  }

  // Edge Cases
  async testInvalidBudgetValues() {
    const invalidBudgets = ['0', '-100', 'abc', '999999999'];
    
    for (const budget of invalidBudgets) {
      await this.fillInput(this.budgetInput, budget);
      await this.clickElement(this.createCampaignButton);
      await this.expectValidationError('budget', 'Please enter a valid budget amount');
      
      // Clear for next iteration
      await this.page.fill(this.budgetInput, '');
    }
  }

  async testInvalidDateRanges() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Start date in the past
    await this.fillInput(this.startDateInput, yesterday);
    await this.clickElement(this.createCampaignButton);
    await this.expectValidationError('start-date', 'Start date cannot be in the past');
    
    // End date before start date
    await this.fillInput(this.startDateInput, today);
    await this.fillInput(this.endDateInput, yesterday);
    await this.clickElement(this.createCampaignButton);
    await this.expectValidationError('end-date', 'End date must be after start date');
  }

  async testNoPlatformSelected() {
    await this.fillCampaignBasics('Test Campaign', 'Test Description', 'conversions');
    await this.setCampaignBudget('1000', 'daily');
    await this.clickElement(this.createCampaignButton);
    
    await this.expectValidationError('platform-selection', 'Please select at least one platform');
  }

  async testDisconnectedPlatformSelection() {
    // Mock disconnected platform
    await this.mockApiCall('platforms/status', {
      'google-ads': { connected: false },
      'meta': { connected: true }
    });

    await this.selectPlatforms(['Google Ads']);
    await this.clickElement(this.createCampaignButton);
    
    await this.expectErrorMessage('Google Ads is not connected. Please connect it first.');
    await this.expectElementToBeVisible('[data-testid="connect-platform-link"]');
  }

  // Network Error Tests
  async testCampaignCreationFailure() {
    await this.mockApiCall('campaigns', { error: 'Campaign creation failed' }, 500);
    
    await this.createCompleteCampaign();
    await this.expectErrorMessage('Failed to create campaign. Please try again.');
  }

  async testNetworkTimeout() {
    await this.page.route('**/campaigns', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request timeout' })
      });
    });

    await this.createCompleteCampaign();
    await this.expectElementToBeVisible('[data-testid="creating-campaign-loader"]');
    await this.expectErrorMessage('Request timed out. Please try again.');
  }

  // Draft Functionality Tests
  async testAutoDraftSave() {
    await this.fillInput(this.campaignNameInput, 'Auto Draft Test');
    
    // Wait for auto-save (usually triggered after a delay)
    await this.page.waitForTimeout(3000);
    await this.expectElementToBeVisible('[data-testid="auto-save-indicator"]');
  }

  async testDraftRecovery() {
    // Mock existing draft
    await this.mockApiCall('campaigns/draft', {
      name: 'Recovered Draft',
      description: 'This is a recovered draft',
      objective: 'traffic'
    });

    await this.goToCampaignBuilder();
    
    // Should show draft recovery modal
    await this.expectElementToBeVisible('[data-testid="draft-recovery-modal"]');
    await this.clickElement('[data-testid="restore-draft-button"]');
    
    // Form should be populated with draft data
    await this.expectElementToContainText(this.campaignNameInput, 'Recovered Draft');
  }

  // AI-Generated Content Tests
  async testAIContentGeneration() {
    await this.fillInput(this.campaignNameInput, 'AI Test Campaign');
    await this.fillInput(this.campaignDescriptionInput, 'Technology product launch');
    
    await this.clickElement('[data-testid="generate-ai-content-button"]');
    await this.expectElementToBeVisible('[data-testid="ai-generation-modal"]');
    
    // Mock AI response
    await this.mockApiCall('ai/generate-campaign-content', {
      suggestions: {
        headlines: ['Revolutionary Tech Product', 'Innovation at Your Fingertips'],
        descriptions: ['Discover the future of technology', 'Transform your workflow'],
        keywords: ['technology', 'innovation', 'productivity']
      }
    });

    await this.clickElement('[data-testid="generate-content-button"]');
    await this.expectElementToBeVisible('[data-testid="ai-suggestions"]');
    
    // Apply suggestions
    await this.clickElement('[data-testid="apply-headline-0"]');
    await this.clickElement('[data-testid="apply-description-0"]');
    await this.clickElement('[data-testid="apply-suggestions-button"]');
  }

  // Audience Insights Tests
  async testAudienceInsights() {
    await this.configureTargetAudience({
      ageRange: '25-34',
      gender: 'all',
      locations: ['United States'],
      interests: ['Technology']
    });

    await this.clickElement('[data-testid="view-audience-insights-button"]');
    await this.expectElementToBeVisible('[data-testid="audience-insights-panel"]');
    
    // Should show audience size and demographics
    await this.expectElementToBeVisible('[data-testid="estimated-reach"]');
    await this.expectElementToBeVisible('[data-testid="audience-demographics"]');
  }

  // Budget Optimization Tests
  async testBudgetRecommendations() {
    await this.fillInput(this.budgetInput, '50');
    await this.configureTargetAudience({
      locations: ['United States', 'Canada', 'United Kingdom'],
      interests: ['Technology', 'Marketing', 'Business']
    });

    await this.clickElement('[data-testid="get-budget-recommendations-button"]');
    await this.expectElementToBeVisible('[data-testid="budget-recommendations"]');
    await this.expectElementToContainText('[data-testid="budget-recommendations"]', 'Recommended budget');
  }

  // Accessibility Tests
  async testKeyboardNavigation() {
    // Test tab navigation through form fields
    await this.page.keyboard.press('Tab'); // Campaign name
    await this.expectElementToBeVisible(`${this.campaignNameInput}:focus`);
    
    await this.page.keyboard.press('Tab'); // Description
    await this.expectElementToBeVisible(`${this.campaignDescriptionInput}:focus`);
    
    await this.page.keyboard.press('Tab'); // Objective
    await this.expectElementToBeVisible(`${this.campaignObjectiveSelect}:focus`);
  }

  async testScreenReaderSupport() {
    // Check for proper ARIA labels and descriptions
    await this.expectElementToBeVisible(`${this.campaignNameInput}[aria-label]`);
    await this.expectElementToBeVisible(`${this.budgetInput}[aria-describedby]`);
    await this.expectElementToBeVisible(`${this.targetAudienceSection}[role="region"]`);
  }

  // Performance Tests
  async testLargeAudienceConfiguration() {
    // Test with many locations and interests
    const manyLocations = Array.from({ length: 50 }, (_, i) => `Location ${i + 1}`);
    const manyInterests = Array.from({ length: 100 }, (_, i) => `Interest ${i + 1}`);

    await this.configureTargetAudience({
      locations: manyLocations,
      interests: manyInterests
    });

    // Should handle large configurations without performance issues
    await this.expectElementToBeVisible('[data-testid="audience-size-warning"]');
  }
} 