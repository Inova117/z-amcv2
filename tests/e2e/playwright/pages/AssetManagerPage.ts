import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AssetManagerPage extends BasePage {
  // Selectors
  private readonly uploadButton = '[data-testid="upload-button"]';
  private readonly fileInput = '[data-testid="file-input"]';
  private readonly dragDropZone = '[data-testid="drag-drop-zone"]';
  private readonly assetGrid = '[data-testid="asset-grid"]';
  private readonly assetCard = '[data-testid="asset-card"]';
  private readonly deleteAssetButton = '[data-testid="delete-asset-button"]';
  private readonly editAssetButton = '[data-testid="edit-asset-button"]';
  private readonly previewAssetButton = '[data-testid="preview-asset-button"]';
  private readonly assetNameInput = '[data-testid="asset-name-input"]';
  private readonly assetTagsInput = '[data-testid="asset-tags-input"]';
  private readonly assetDescriptionInput = '[data-testid="asset-description-input"]';
  private readonly saveAssetButton = '[data-testid="save-asset-button"]';
  private readonly filterDropdown = '[data-testid="filter-dropdown"]';
  private readonly searchInput = '[data-testid="search-input"]';
  private readonly sortDropdown = '[data-testid="sort-dropdown"]';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goToAssetManager() {
    await this.goto('/assets');
  }

  // File Upload Methods
  async uploadFile(filePath: string) {
    await this.page.setInputFiles(this.fileInput, filePath);
    await this.waitForUploadComplete();
  }

  async uploadMultipleFiles(filePaths: string[]) {
    await this.page.setInputFiles(this.fileInput, filePaths);
    await this.waitForUploadComplete();
  }

  async dragAndDropFile(filePath: string) {
    // Simulate drag and drop
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.clickElement(this.dragDropZone);
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await this.waitForUploadComplete();
  }

  private async waitForUploadComplete() {
    await this.waitForElementToBeHidden('[data-testid="upload-progress"]');
    await this.expectSuccessMessage('File uploaded successfully');
  }

  // Asset Management
  async editAsset(assetName: string, newData: {
    name?: string;
    description?: string;
    tags?: string[];
  }) {
    await this.clickAssetAction(assetName, 'edit');
    
    if (newData.name) {
      await this.fillInput(this.assetNameInput, newData.name);
    }
    
    if (newData.description) {
      await this.fillInput(this.assetDescriptionInput, newData.description);
    }
    
    if (newData.tags) {
      await this.page.fill(this.assetTagsInput, '');
      for (const tag of newData.tags) {
        await this.fillInput(this.assetTagsInput, tag);
        await this.page.keyboard.press('Enter');
      }
    }
    
    await this.clickElement(this.saveAssetButton);
    await this.expectSuccessMessage('Asset updated successfully');
  }

  async deleteAsset(assetName: string) {
    await this.clickAssetAction(assetName, 'delete');
    await this.clickElement('[data-testid="confirm-delete-button"]');
    await this.expectSuccessMessage('Asset deleted successfully');
  }

  async previewAsset(assetName: string) {
    await this.clickAssetAction(assetName, 'preview');
    await this.expectElementToBeVisible('[data-testid="asset-preview-modal"]');
  }

  private async clickAssetAction(assetName: string, action: 'edit' | 'delete' | 'preview') {
    const assetCard = `[data-testid="asset-${assetName}"]`;
    await this.clickElement(`${assetCard} [data-testid="${action}-asset-button"]`);
  }

  // Search and Filter
  async searchAssets(query: string) {
    await this.fillInput(this.searchInput, query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingToFinish();
  }

  async filterAssetsByType(type: string) {
    await this.selectOption(this.filterDropdown, type);
    await this.waitForLoadingToFinish();
  }

  async sortAssets(sortBy: string) {
    await this.selectOption(this.sortDropdown, sortBy);
    await this.waitForLoadingToFinish();
  }

  // Validation and Expectations
  async expectAssetExists(assetName: string) {
    await this.expectElementToBeVisible(`[data-testid="asset-${assetName}"]`);
  }

  async expectAssetNotExists(assetName: string) {
    await this.expectElementToBeHidden(`[data-testid="asset-${assetName}"]`);
  }

  async expectAssetCount(count: number) {
    const assets = await this.page.locator(this.assetCard).count();
    expect(assets).toBe(count);
  }

  // Empty State Tests
  async expectEmptyState() {
    await this.expectElementToBeVisible('[data-testid="assets-empty-state"]');
    await this.expectElementToContainText('[data-testid="assets-empty-state"]', 'No assets found');
    await this.expectElementToContainText('[data-testid="assets-empty-state"]', 'Upload your first asset to get started');
  }

  async testEmptyStateActions() {
    await this.expectElementToBeVisible('[data-testid="upload-first-asset-button"]');
    await this.clickElement('[data-testid="upload-first-asset-button"]');
    await this.expectElementToBeVisible('[data-testid="upload-modal"]');
  }

  // Error State Tests
  async testInvalidFileUpload() {
    // Test unsupported file types
    const invalidFiles = [
      'test.exe',
      'test.bat',
      'test.dmg'
    ];

    for (const file of invalidFiles) {
      await this.uploadFile(file);
      await this.expectErrorMessage('File type not supported');
    }
  }

  async testFileSizeLimit() {
    // Mock large file upload
    await this.mockApiCall('assets/upload', { error: 'File too large' }, 413);
    
    await this.uploadFile('large-file.jpg');
    await this.expectErrorMessage('File size exceeds the maximum limit');
  }

  async testUploadFailure() {
    await this.mockApiCall('assets/upload', { error: 'Upload failed' }, 500);
    
    await this.uploadFile('test-image.jpg');
    await this.expectErrorMessage('Upload failed. Please try again.');
  }

  async testNetworkTimeout() {
    await this.page.route('**/assets/upload', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Upload timeout' })
      });
    });

    await this.uploadFile('test-image.jpg');
    await this.expectElementToBeVisible('[data-testid="upload-progress"]');
    await this.expectErrorMessage('Upload timed out. Please try again.');
  }

  // Edge Cases
  async testDuplicateFileUpload() {
    await this.uploadFile('test-image.jpg');
    await this.expectAssetExists('test-image.jpg');
    
    // Upload same file again
    await this.uploadFile('test-image.jpg');
    await this.expectElementToBeVisible('[data-testid="duplicate-file-modal"]');
    
    // Choose to replace
    await this.clickElement('[data-testid="replace-file-button"]');
    await this.expectSuccessMessage('File replaced successfully');
  }

  async testConcurrentUploads() {
    const files = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
    
    // Start multiple uploads simultaneously
    const uploadPromises = files.map(file => this.uploadFile(file));
    await Promise.all(uploadPromises);
    
    // All files should be uploaded
    for (const file of files) {
      await this.expectAssetExists(file);
    }
  }

  async testBulkOperations() {
    // Upload multiple files first
    await this.uploadMultipleFiles(['image1.jpg', 'image2.jpg', 'image3.jpg']);
    
    // Select multiple assets
    await this.clickElement('[data-testid="select-all-checkbox"]');
    await this.expectElementToBeVisible('[data-testid="bulk-actions-toolbar"]');
    
    // Bulk delete
    await this.clickElement('[data-testid="bulk-delete-button"]');
    await this.clickElement('[data-testid="confirm-bulk-delete-button"]');
    await this.expectSuccessMessage('Assets deleted successfully');
  }

  // Asset Organization Tests
  async testAssetTagging() {
    await this.uploadFile('test-image.jpg');
    await this.editAsset('test-image.jpg', {
      tags: ['marketing', 'social-media', 'campaign-2024']
    });
    
    // Filter by tag
    await this.searchAssets('tag:marketing');
    await this.expectAssetExists('test-image.jpg');
  }

  async testAssetFolders() {
    await this.clickElement('[data-testid="create-folder-button"]');
    await this.fillInput('[data-testid="folder-name-input"]', 'Campaign Assets');
    await this.clickElement('[data-testid="create-folder-confirm-button"]');
    
    // Move asset to folder
    await this.dragAssetToFolder('test-image.jpg', 'Campaign Assets');
    await this.expectSuccessMessage('Asset moved to folder');
  }

  private async dragAssetToFolder(assetName: string, folderName: string) {
    const asset = this.page.locator(`[data-testid="asset-${assetName}"]`);
    const folder = this.page.locator(`[data-testid="folder-${folderName}"]`);
    await asset.dragTo(folder);
  }

  // Asset Processing Tests
  async testImageOptimization() {
    await this.uploadFile('large-image.jpg');
    
    // Should show optimization options
    await this.expectElementToBeVisible('[data-testid="optimization-options"]');
    await this.clickElement('[data-testid="optimize-image-button"]');
    
    await this.waitForElementToBeHidden('[data-testid="optimization-progress"]');
    await this.expectSuccessMessage('Image optimized successfully');
  }

  async testAssetVariants() {
    await this.uploadFile('banner-image.jpg');
    await this.clickAssetAction('banner-image.jpg', 'edit');
    
    await this.clickElement('[data-testid="generate-variants-button"]');
    await this.expectElementToBeVisible('[data-testid="variant-generation-modal"]');
    
    // Select variant sizes
    await this.clickElement('[data-testid="variant-1080x1080"]');
    await this.clickElement('[data-testid="variant-1200x628"]');
    await this.clickElement('[data-testid="generate-variants-confirm"]');
    
    await this.waitForElementToBeHidden('[data-testid="variant-generation-progress"]');
    await this.expectSuccessMessage('Variants generated successfully');
  }

  // Search and Discovery Tests
  async testAdvancedSearch() {
    await this.clickElement('[data-testid="advanced-search-button"]');
    await this.expectElementToBeVisible('[data-testid="advanced-search-modal"]');
    
    // Search by multiple criteria
    await this.fillInput('[data-testid="search-name"]', 'campaign');
    await this.selectOption('[data-testid="search-type"]', 'image');
    await this.fillInput('[data-testid="search-tags"]', 'marketing');
    await this.selectOption('[data-testid="search-date-range"]', 'last-week');
    
    await this.clickElement('[data-testid="apply-search-button"]');
    await this.waitForLoadingToFinish();
  }

  async testAssetRecommendations() {
    await this.uploadFile('product-image.jpg');
    
    await this.clickElement('[data-testid="view-recommendations-button"]');
    await this.expectElementToBeVisible('[data-testid="asset-recommendations"]');
    await this.expectElementToContainText('[data-testid="asset-recommendations"]', 'Similar assets');
  }

  // Performance Tests
  async testLargeAssetLibrary() {
    // Mock large number of assets
    await this.mockApiCall('assets', {
      assets: Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `asset-${i + 1}.jpg`,
        type: 'image',
        size: 1024 * 1024,
        createdAt: new Date().toISOString()
      }))
    });

    await this.goToAssetManager();
    
    // Should implement pagination or virtual scrolling
    await this.expectElementToBeVisible('[data-testid="pagination"]');
    await this.expectElementToContainText('[data-testid="asset-count"]', '1000 assets');
  }

  async testAssetPreviewPerformance() {
    await this.uploadFile('high-res-image.jpg');
    await this.previewAsset('high-res-image.jpg');
    
    // Should show loading state for large images
    await this.expectElementToBeVisible('[data-testid="preview-loading"]');
    await this.waitForElementToBeHidden('[data-testid="preview-loading"]');
    await this.expectElementToBeVisible('[data-testid="asset-preview-image"]');
  }

  // Accessibility Tests
  async testKeyboardNavigation() {
    await this.uploadFile('test-image.jpg');
    
    // Navigate through assets with keyboard
    await this.page.keyboard.press('Tab'); // First asset
    await this.page.keyboard.press('Enter'); // Should open preview
    await this.expectElementToBeVisible('[data-testid="asset-preview-modal"]');
    
    await this.page.keyboard.press('Escape'); // Should close preview
    await this.expectElementToBeHidden('[data-testid="asset-preview-modal"]');
  }

  async testScreenReaderSupport() {
    await this.uploadFile('test-image.jpg');
    
    // Check for proper ARIA labels
    await this.expectElementToBeVisible(`${this.assetCard}[aria-label]`);
    await this.expectElementToBeVisible(`${this.uploadButton}[aria-describedby]`);
    await this.expectElementToBeVisible(`${this.dragDropZone}[role="button"]`);
  }

  // Integration Tests
  async testAssetUsageTracking() {
    await this.uploadFile('campaign-banner.jpg');
    
    // Asset should show usage information
    await this.clickAssetAction('campaign-banner.jpg', 'edit');
    await this.expectElementToBeVisible('[data-testid="asset-usage-info"]');
    await this.expectElementToContainText('[data-testid="asset-usage-info"]', 'Used in 0 campaigns');
  }

  async testAssetVersioning() {
    await this.uploadFile('logo.png');
    
    // Upload new version
    await this.uploadFile('logo-v2.png');
    await this.expectElementToBeVisible('[data-testid="version-conflict-modal"]');
    
    await this.clickElement('[data-testid="create-new-version-button"]');
    await this.expectElementToBeVisible('[data-testid="asset-versions-list"]');
  }
} 