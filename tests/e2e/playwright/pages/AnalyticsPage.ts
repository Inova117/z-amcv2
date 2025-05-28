import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AnalyticsPage extends BasePage {
  // Selectors
  private readonly dashboardOverview = '[data-testid="dashboard-overview"]';
  private readonly campaignMetricsCard = '[data-testid="campaign-metrics-card"]';
  private readonly performanceChart = '[data-testid="performance-chart"]';
  private readonly dateRangeSelector = '[data-testid="date-range-selector"]';
  private readonly campaignFilter = '[data-testid="campaign-filter"]';
  private readonly platformFilter = '[data-testid="platform-filter"]';
  private readonly exportButton = '[data-testid="export-button"]';
  private readonly refreshButton = '[data-testid="refresh-button"]';
  private readonly metricsTable = '[data-testid="metrics-table"]';
  private readonly kpiCards = '[data-testid="kpi-cards"]';
  private readonly conversionFunnel = '[data-testid="conversion-funnel"]';
  private readonly audienceInsights = '[data-testid="audience-insights"]';
  private readonly realTimeMetrics = '[data-testid="real-time-metrics"]';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async goToAnalytics() {
    await this.goto('/analytics');
  }

  async goToCampaignAnalytics(campaignId: string) {
    await this.goto(`/analytics/campaigns/${campaignId}`);
  }

  // Data Filtering and Selection
  async selectDateRange(range: string) {
    await this.selectOption(this.dateRangeSelector, range);
    await this.waitForDataRefresh();
  }

  async selectCustomDateRange(startDate: string, endDate: string) {
    await this.selectOption(this.dateRangeSelector, 'custom');
    await this.fillInput('[data-testid="start-date-input"]', startDate);
    await this.fillInput('[data-testid="end-date-input"]', endDate);
    await this.clickElement('[data-testid="apply-date-range-button"]');
    await this.waitForDataRefresh();
  }

  async filterByCampaign(campaignName: string) {
    await this.selectOption(this.campaignFilter, campaignName);
    await this.waitForDataRefresh();
  }

  async filterByPlatform(platform: string) {
    await this.selectOption(this.platformFilter, platform);
    await this.waitForDataRefresh();
  }

  private async waitForDataRefresh() {
    await this.waitForLoadingToFinish();
    await this.waitForElementToBeHidden('[data-testid="data-loading"]');
  }

  // Data Export and Actions
  async exportData(format: 'csv' | 'pdf' | 'excel') {
    await this.clickElement(this.exportButton);
    await this.clickElement(`[data-testid="export-${format}"]`);
    await this.expectSuccessMessage('Export started');
  }

  async refreshData() {
    await this.clickElement(this.refreshButton);
    await this.waitForDataRefresh();
  }

  // Metrics Validation
  async expectKPIValue(metric: string, value: string) {
    const kpiCard = `[data-testid="kpi-${metric}"]`;
    await this.expectElementToBeVisible(kpiCard);
    await this.expectElementToContainText(`${kpiCard} [data-testid="kpi-value"]`, value);
  }

  async expectMetricTrend(metric: string, trend: 'up' | 'down' | 'stable') {
    const trendIcon = `[data-testid="trend-${metric}"]`;
    await this.expectElementToBeVisible(trendIcon);
    await this.expectElementToBeVisible(`${trendIcon}.trend-${trend}`);
  }

  async expectChartDataPoints(chartId: string, expectedCount: number) {
    const dataPoints = await this.page.locator(`[data-testid="${chartId}"] .chart-data-point`).count();
    expect(dataPoints).toBeGreaterThanOrEqual(expectedCount);
  }

  // Empty State Tests
  async expectNoDataState() {
    await this.expectElementToBeVisible('[data-testid="no-data-state"]');
    await this.expectElementToContainText('[data-testid="no-data-state"]', 'No data available');
    await this.expectElementToContainText('[data-testid="no-data-state"]', 'Try adjusting your filters or date range');
  }

  async testEmptyStateActions() {
    await this.expectElementToBeVisible('[data-testid="create-campaign-cta"]');
    await this.clickElement('[data-testid="create-campaign-cta"]');
    await this.expectUrl('/campaigns/create');
  }

  // Error State Tests
  async testDataLoadingFailure() {
    await this.mockApiCall('analytics/dashboard', { error: 'Data loading failed' }, 500);
    
    await this.goToAnalytics();
    await this.expectErrorMessage('Failed to load analytics data');
    await this.expectElementToBeVisible('[data-testid="retry-button"]');
  }

  async testNetworkTimeout() {
    await this.page.route('**/analytics/dashboard', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request timeout' })
      });
    });

    await this.goToAnalytics();
    await this.expectElementToBeVisible('[data-testid="loading-analytics"]');
    await this.expectErrorMessage('Request timed out');
  }

  async testPartialDataFailure() {
    // Mock partial data loading failure
    await this.mockApiCall('analytics/campaigns', { error: 'Campaign data unavailable' }, 503);
    
    await this.goToAnalytics();
    await this.expectElementToBeVisible('[data-testid="partial-data-warning"]');
    await this.expectElementToContainText('[data-testid="partial-data-warning"]', 'Some data may be incomplete');
  }

  // Real-time Data Tests
  async testRealTimeUpdates() {
    await this.goToAnalytics();
    
    // Should show real-time indicator
    await this.expectElementToBeVisible('[data-testid="real-time-indicator"]');
    
    // Mock real-time data update
    await this.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('analytics-update', {
        detail: { impressions: 1500, clicks: 75, conversions: 5 }
      }));
    });

    // Metrics should update
    await this.expectKPIValue('impressions', '1,500');
    await this.expectKPIValue('clicks', '75');
    await this.expectKPIValue('conversions', '5');
  }

  async testDataRefreshInterval() {
    await this.goToAnalytics();
    
    // Should show last updated timestamp
    await this.expectElementToBeVisible('[data-testid="last-updated"]');
    
    // Wait for auto-refresh (typically 30 seconds)
    await this.page.waitForTimeout(31000);
    
    // Timestamp should update
    const newTimestamp = await this.page.textContent('[data-testid="last-updated"]');
    expect(newTimestamp).toContain('seconds ago');
  }

  // Chart Interaction Tests
  async testChartInteractivity() {
    await this.goToAnalytics();
    
    // Hover over chart data point
    await this.page.hover('[data-testid="performance-chart"] .chart-data-point:first-child');
    await this.expectElementToBeVisible('[data-testid="chart-tooltip"]');
    
    // Click on chart legend
    await this.clickElement('[data-testid="chart-legend-impressions"]');
    await this.expectElementToBeHidden('[data-testid="chart-line-impressions"]');
    
    // Click again to show
    await this.clickElement('[data-testid="chart-legend-impressions"]');
    await this.expectElementToBeVisible('[data-testid="chart-line-impressions"]');
  }

  async testChartZoom() {
    await this.goToAnalytics();
    
    // Select area on chart to zoom
    const chart = this.page.locator('[data-testid="performance-chart"]');
    const box = await chart.boundingBox();
    
    if (box) {
      await this.page.mouse.move(box.x + 100, box.y + 100);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + 300, box.y + 200);
      await this.page.mouse.up();
    }
    
    // Should show zoom controls
    await this.expectElementToBeVisible('[data-testid="chart-zoom-controls"]');
    
    // Reset zoom
    await this.clickElement('[data-testid="reset-zoom-button"]');
  }

  // Comparison Tests
  async testPeriodComparison() {
    await this.selectDateRange('last-30-days');
    
    // Enable comparison
    await this.clickElement('[data-testid="enable-comparison-button"]');
    await this.selectOption('[data-testid="comparison-period"]', 'previous-period');
    
    // Should show comparison data
    await this.expectElementToBeVisible('[data-testid="comparison-metrics"]');
    await this.expectElementToBeVisible('[data-testid="comparison-chart"]');
    
    // Should show percentage changes
    await this.expectElementToBeVisible('[data-testid="metric-change-impressions"]');
    await this.expectElementToBeVisible('[data-testid="metric-change-clicks"]');
  }

  async testCampaignComparison() {
    await this.clickElement('[data-testid="compare-campaigns-button"]');
    await this.expectElementToBeVisible('[data-testid="campaign-comparison-modal"]');
    
    // Select campaigns to compare
    await this.clickElement('[data-testid="campaign-checkbox-1"]');
    await this.clickElement('[data-testid="campaign-checkbox-2"]');
    await this.clickElement('[data-testid="apply-comparison-button"]');
    
    // Should show comparison table
    await this.expectElementToBeVisible('[data-testid="campaign-comparison-table"]');
  }

  // Advanced Analytics Tests
  async testConversionFunnelAnalysis() {
    await this.clickElement('[data-testid="conversion-funnel-tab"]');
    await this.expectElementToBeVisible(this.conversionFunnel);
    
    // Should show funnel stages
    await this.expectElementToBeVisible('[data-testid="funnel-stage-awareness"]');
    await this.expectElementToBeVisible('[data-testid="funnel-stage-consideration"]');
    await this.expectElementToBeVisible('[data-testid="funnel-stage-conversion"]');
    
    // Click on funnel stage for details
    await this.clickElement('[data-testid="funnel-stage-consideration"]');
    await this.expectElementToBeVisible('[data-testid="funnel-stage-details"]');
  }

  async testAudienceInsights() {
    await this.clickElement('[data-testid="audience-insights-tab"]');
    await this.expectElementToBeVisible(this.audienceInsights);
    
    // Should show demographic breakdowns
    await this.expectElementToBeVisible('[data-testid="age-demographics"]');
    await this.expectElementToBeVisible('[data-testid="gender-demographics"]');
    await this.expectElementToBeVisible('[data-testid="location-demographics"]');
    
    // Test demographic filter
    await this.clickElement('[data-testid="age-group-25-34"]');
    await this.waitForDataRefresh();
    await this.expectElementToContainText('[data-testid="filtered-audience"]', 'Age: 25-34');
  }

  async testAttributionAnalysis() {
    await this.clickElement('[data-testid="attribution-tab"]');
    await this.expectElementToBeVisible('[data-testid="attribution-model"]');
    
    // Change attribution model
    await this.selectOption('[data-testid="attribution-model-select"]', 'last-click');
    await this.waitForDataRefresh();
    
    // Should show attribution data
    await this.expectElementToBeVisible('[data-testid="attribution-channels"]');
    await this.expectElementToBeVisible('[data-testid="attribution-touchpoints"]');
  }

  // Performance Tests
  async testLargeDatasetHandling() {
    // Mock large dataset
    await this.mockApiCall('analytics/dashboard', {
      campaigns: Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Campaign ${i + 1}`,
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 100)
      }))
    });

    await this.goToAnalytics();
    
    // Should implement pagination or virtualization
    await this.expectElementToBeVisible('[data-testid="data-pagination"]');
    await this.expectElementToContainText('[data-testid="total-campaigns"]', '1000');
  }

  async testChartPerformance() {
    // Mock high-frequency data
    await this.mockApiCall('analytics/timeseries', {
      data: Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        impressions: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 50)
      }))
    });

    await this.goToAnalytics();
    
    // Chart should render without performance issues
    await this.expectElementToBeVisible('[data-testid="performance-chart"]');
    
    // Should show data aggregation options
    await this.expectElementToBeVisible('[data-testid="data-granularity-selector"]');
  }

  // Accessibility Tests
  async testKeyboardNavigation() {
    await this.goToAnalytics();
    
    // Navigate through KPI cards
    await this.page.keyboard.press('Tab');
    await this.expectElementToBeVisible('[data-testid="kpi-impressions"]:focus');
    
    await this.page.keyboard.press('Tab');
    await this.expectElementToBeVisible('[data-testid="kpi-clicks"]:focus');
    
    // Navigate to chart
    await this.page.keyboard.press('Tab');
    await this.expectElementToBeVisible('[data-testid="performance-chart"]:focus');
  }

  async testScreenReaderSupport() {
    await this.goToAnalytics();
    
    // Check for proper ARIA labels
    await this.expectElementToBeVisible('[data-testid="performance-chart"][aria-label]');
    await this.expectElementToBeVisible('[data-testid="metrics-table"][role="table"]');
    await this.expectElementToBeVisible('[data-testid="kpi-cards"][role="region"]');
    
    // Check for data table headers
    await this.expectElementToBeVisible('[data-testid="metrics-table"] th[scope="col"]');
  }

  // Integration Tests
  async testDrillDownNavigation() {
    await this.goToAnalytics();
    
    // Click on campaign in table
    await this.clickElement('[data-testid="campaign-row-1"] [data-testid="campaign-name"]');
    await this.expectUrl('/analytics/campaigns/1');
    
    // Should show campaign-specific analytics
    await this.expectElementToBeVisible('[data-testid="campaign-details"]');
    await this.expectElementToBeVisible('[data-testid="campaign-performance-chart"]');
  }

  async testAlertConfiguration() {
    await this.clickElement('[data-testid="alerts-tab"]');
    await this.expectElementToBeVisible('[data-testid="alerts-configuration"]');
    
    // Create new alert
    await this.clickElement('[data-testid="create-alert-button"]');
    await this.fillInput('[data-testid="alert-name"]', 'Low CTR Alert');
    await this.selectOption('[data-testid="alert-metric"]', 'ctr');
    await this.selectOption('[data-testid="alert-condition"]', 'less-than');
    await this.fillInput('[data-testid="alert-threshold"]', '1.0');
    
    await this.clickElement('[data-testid="save-alert-button"]');
    await this.expectSuccessMessage('Alert created successfully');
  }

  // Data Validation Tests
  async testDataAccuracy() {
    await this.goToAnalytics();
    
    // Verify calculation accuracy
    const impressions = await this.page.textContent('[data-testid="kpi-impressions"] [data-testid="kpi-value"]');
    const clicks = await this.page.textContent('[data-testid="kpi-clicks"] [data-testid="kpi-value"]');
    const ctr = await this.page.textContent('[data-testid="kpi-ctr"] [data-testid="kpi-value"]');
    
    if (impressions && clicks && ctr) {
      const expectedCTR = (parseInt(clicks.replace(/,/g, '')) / parseInt(impressions.replace(/,/g, '')) * 100).toFixed(2);
      expect(ctr).toContain(expectedCTR);
    }
  }

  async testDataConsistency() {
    await this.goToAnalytics();
    
    // Get overview metrics
    const overviewImpressions = await this.page.textContent('[data-testid="kpi-impressions"] [data-testid="kpi-value"]');
    
    // Navigate to detailed view
    await this.clickElement('[data-testid="detailed-view-button"]');
    
    // Verify metrics match
    const detailedImpressions = await this.page.textContent('[data-testid="detailed-impressions"]');
    expect(overviewImpressions).toBe(detailedImpressions);
  }
} 