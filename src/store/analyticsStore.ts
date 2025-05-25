import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  platform: 'google_ads' | 'meta' | 'linkedin' | 'twitter';
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpm: number; // Cost per mille
  roas: number; // Return on ad spend
  timestamp: string;
  date: string;
}

export interface AnalyticsFilters {
  platforms: string[];
  dateRange: {
    start: string;
    end: string;
  };
  campaigns: string[];
  metrics: string[];
}

export interface AnalyticsState {
  // Data
  metrics: CampaignMetrics[];
  aggregatedMetrics: Record<string, any>;
  isLoading: boolean;
  lastUpdated: string | null;
  
  // Filters
  filters: AnalyticsFilters;
  
  // UI State
  selectedCampaigns: string[];
  compareMode: boolean;
  viewMode: 'overview' | 'campaigns' | 'platforms';
  chartType: 'line' | 'bar' | 'area';
  
  // Real-time
  isRealTimeEnabled: boolean;
  updateInterval: number;
  
  // Export
  isExporting: boolean;
  exportFormat: 'csv' | 'pdf';
  
  // Actions
  setMetrics: (metrics: CampaignMetrics[]) => void;
  addMetrics: (metrics: CampaignMetrics[]) => void;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  setSelectedCampaigns: (campaigns: string[]) => void;
  toggleCompareMode: () => void;
  setViewMode: (mode: 'overview' | 'campaigns' | 'platforms') => void;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  toggleRealTime: () => void;
  setUpdateInterval: (interval: number) => void;
  exportData: (format: 'csv' | 'pdf') => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
  
  // Computed
  getFilteredMetrics: () => CampaignMetrics[];
  getAggregatedData: () => Record<string, any>;
  getPlatformComparison: () => Record<string, any>;
  getCampaignComparison: () => Record<string, any>;
}

const defaultFilters: AnalyticsFilters = {
  platforms: [],
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0], // today
  },
  campaigns: [],
  metrics: ['impressions', 'clicks', 'spend', 'roas'],
};

export const useAnalyticsStore = create<AnalyticsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    metrics: [],
    aggregatedMetrics: {},
    isLoading: false,
    lastUpdated: null,
    
    filters: defaultFilters,
    
    selectedCampaigns: [],
    compareMode: false,
    viewMode: 'overview',
    chartType: 'line',
    
    isRealTimeEnabled: true,
    updateInterval: 30000, // 30 seconds
    
    isExporting: false,
    exportFormat: 'csv',
    
    // Actions
    setMetrics: (metrics) => set({ 
      metrics, 
      lastUpdated: new Date().toISOString(),
      isLoading: false 
    }),
    
    addMetrics: (newMetrics) => set((state) => ({
      metrics: [...state.metrics, ...newMetrics],
      lastUpdated: new Date().toISOString(),
    })),
    
    updateFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
    
    setSelectedCampaigns: (campaigns) => set({ selectedCampaigns: campaigns }),
    
    toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode })),
    
    setViewMode: (mode) => set({ viewMode: mode }),
    
    setChartType: (type) => set({ chartType: type }),
    
    toggleRealTime: () => set((state) => ({ 
      isRealTimeEnabled: !state.isRealTimeEnabled 
    })),
    
    setUpdateInterval: (interval) => set({ updateInterval: interval }),
    
    exportData: async (format) => {
      set({ isExporting: true, exportFormat: format });
      
      try {
        const { getFilteredMetrics } = get();
        const data = getFilteredMetrics();
        
        if (format === 'csv') {
          await exportToCSV(data);
        } else if (format === 'pdf') {
          await exportToPDF(data);
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        set({ isExporting: false });
      }
    },
    
    refreshData: async () => {
      set({ isLoading: true });
      // This will be implemented in the hook
    },
    
    clearData: () => set({ 
      metrics: [], 
      aggregatedMetrics: {},
      lastUpdated: null 
    }),
    
    // Computed functions
    getFilteredMetrics: () => {
      const { metrics, filters } = get();
      
      return metrics.filter((metric) => {
        // Platform filter
        if (filters.platforms.length > 0 && !filters.platforms.includes(metric.platform)) {
          return false;
        }
        
        // Date range filter
        const metricDate = new Date(metric.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (metricDate < startDate || metricDate > endDate) {
          return false;
        }
        
        // Campaign filter
        if (filters.campaigns.length > 0 && !filters.campaigns.includes(metric.campaignId)) {
          return false;
        }
        
        return true;
      });
    },
    
    getAggregatedData: () => {
      const { getFilteredMetrics } = get();
      const metrics = getFilteredMetrics();
      
      if (metrics.length === 0) return {};
      
      const totals = metrics.reduce((acc, metric) => ({
        impressions: acc.impressions + metric.impressions,
        clicks: acc.clicks + metric.clicks,
        spend: acc.spend + metric.spend,
        conversions: acc.conversions + metric.conversions,
        revenue: acc.revenue + metric.revenue,
      }), {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
      });
      
      return {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      };
    },
    
    getPlatformComparison: () => {
      const { getFilteredMetrics } = get();
      const metrics = getFilteredMetrics();
      
      const platformData = metrics.reduce((acc, metric) => {
        if (!acc[metric.platform]) {
          acc[metric.platform] = {
            platform: metric.platform,
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            revenue: 0,
          };
        }
        
        acc[metric.platform].impressions += metric.impressions;
        acc[metric.platform].clicks += metric.clicks;
        acc[metric.platform].spend += metric.spend;
        acc[metric.platform].conversions += metric.conversions;
        acc[metric.platform].revenue += metric.revenue;
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate derived metrics
      Object.values(platformData).forEach((data: any) => {
        data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        data.cpc = data.clicks > 0 ? data.spend / data.clicks : 0;
        data.cpm = data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0;
        data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
      });
      
      return Object.values(platformData);
    },
    
    getCampaignComparison: () => {
      const { getFilteredMetrics } = get();
      const metrics = getFilteredMetrics();
      
      const campaignData = metrics.reduce((acc, metric) => {
        if (!acc[metric.campaignId]) {
          acc[metric.campaignId] = {
            campaignId: metric.campaignId,
            campaignName: metric.campaignName,
            platform: metric.platform,
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            revenue: 0,
          };
        }
        
        acc[metric.campaignId].impressions += metric.impressions;
        acc[metric.campaignId].clicks += metric.clicks;
        acc[metric.campaignId].spend += metric.spend;
        acc[metric.campaignId].conversions += metric.conversions;
        acc[metric.campaignId].revenue += metric.revenue;
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate derived metrics
      Object.values(campaignData).forEach((data: any) => {
        data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        data.cpc = data.clicks > 0 ? data.spend / data.clicks : 0;
        data.cpm = data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0;
        data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
      });
      
      return Object.values(campaignData);
    },
  }))
);

// Export utility functions
async function exportToCSV(data: CampaignMetrics[]) {
  const headers = [
    'Campaign ID',
    'Campaign Name', 
    'Platform',
    'Date',
    'Impressions',
    'Clicks',
    'Spend',
    'Conversions',
    'Revenue',
    'CTR (%)',
    'CPC',
    'CPM',
    'ROAS'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(metric => [
      metric.campaignId,
      `"${metric.campaignName}"`,
      metric.platform,
      metric.date,
      metric.impressions,
      metric.clicks,
      metric.spend.toFixed(2),
      metric.conversions,
      metric.revenue.toFixed(2),
      metric.ctr.toFixed(2),
      metric.cpc.toFixed(2),
      metric.cpm.toFixed(2),
      metric.roas.toFixed(2)
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `campaign-analytics-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportToPDF(data: CampaignMetrics[]) {
  // For now, we'll create a simple HTML table and use the browser's print functionality
  // In a real implementation, you might use libraries like jsPDF or Puppeteer
  const htmlContent = `
    <html>
      <head>
        <title>Campaign Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Campaign Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Platform</th>
              <th>Date</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th>Spend</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(metric => `
              <tr>
                <td>${metric.campaignName}</td>
                <td>${metric.platform}</td>
                <td>${metric.date}</td>
                <td>${metric.impressions.toLocaleString()}</td>
                <td>${metric.clicks.toLocaleString()}</td>
                <td>$${metric.spend.toFixed(2)}</td>
                <td>${metric.roas.toFixed(2)}x</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
} 