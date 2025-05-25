import { useEffect, useCallback, useRef } from 'react';
import { useAnalyticsStore, CampaignMetrics } from '@/store/analyticsStore';
import { useToast } from '@/hooks/use-toast';

// Mock data generator for demo purposes
const generateMockMetrics = (): CampaignMetrics[] => {
  const campaigns = [
    { id: 'camp_1', name: 'Summer Sale 2024', platform: 'google_ads' as const },
    { id: 'camp_2', name: 'Brand Awareness Q4', platform: 'meta' as const },
    { id: 'camp_3', name: 'Product Launch', platform: 'google_ads' as const },
    { id: 'camp_4', name: 'Holiday Campaign', platform: 'meta' as const },
    { id: 'camp_5', name: 'B2B Lead Gen', platform: 'linkedin' as const },
  ];

  const metrics: CampaignMetrics[] = [];
  const now = new Date();

  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    campaigns.forEach(campaign => {
      const baseImpressions = Math.floor(Math.random() * 10000) + 5000;
      const clicks = Math.floor(baseImpressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
      const spend = Math.floor(Math.random() * 500) + 100;
      const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02)); // 2-12% conversion rate
      const revenue = conversions * (Math.random() * 50 + 25); // $25-75 per conversion

      const metric: CampaignMetrics = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: campaign.platform,
        impressions: baseImpressions,
        clicks,
        spend,
        conversions,
        revenue,
        ctr: (clicks / baseImpressions) * 100,
        cpc: spend / clicks,
        cpm: (spend / baseImpressions) * 1000,
        roas: revenue / spend,
        timestamp: date.toISOString(),
        date: dateString,
      };

      metrics.push(metric);
    });
  }

  return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Simulate real-time updates
const generateRealtimeUpdate = (existingMetrics: CampaignMetrics[]): CampaignMetrics[] => {
  const today = new Date().toISOString().split('T')[0];
  const todayMetrics = existingMetrics.filter(m => m.date === today);
  
  return todayMetrics.map(metric => ({
    ...metric,
    impressions: metric.impressions + Math.floor(Math.random() * 100),
    clicks: metric.clicks + Math.floor(Math.random() * 5),
    spend: metric.spend + Math.random() * 10,
    conversions: metric.conversions + Math.floor(Math.random() * 2),
    revenue: metric.revenue + Math.random() * 50,
    timestamp: new Date().toISOString(),
  })).map(metric => ({
    ...metric,
    ctr: (metric.clicks / metric.impressions) * 100,
    cpc: metric.spend / metric.clicks,
    cpm: (metric.spend / metric.impressions) * 1000,
    roas: metric.revenue / metric.spend,
  }));
};

export const useAnalyticsOperations = () => {
  const {
    metrics,
    filters,
    isRealTimeEnabled,
    updateInterval,
    setMetrics,
    addMetrics,
    refreshData,
  } = useAnalyticsStore();

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      // In a real implementation, this would be a GraphQL query
      // const { data } = await client.query({
      //   query: GET_CAMPAIGN_METRICS,
      //   variables: { filters }
      // });

      // For demo purposes, use mock data
      const mockData = generateMockMetrics();
      setMetrics(mockData);

      toast({
        title: "Analytics Updated",
        description: "Campaign metrics have been refreshed",
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
  }, [filters, setMetrics, toast]);

  // Real-time updates
  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (metrics.length > 0) {
        const updates = generateRealtimeUpdate(metrics);
        if (updates.length > 0) {
          // In a real implementation, this would be a GraphQL subscription
          // subscription {
          //   metricsUpdated {
          //     campaignId
          //     metrics { ... }
          //   }
          // }
          
          // Update existing metrics with new data
          const updatedMetrics = metrics.map(metric => {
            const update = updates.find(u => 
              u.campaignId === metric.campaignId && u.date === metric.date
            );
            return update || metric;
          });
          
          setMetrics(updatedMetrics);
        }
      }
    }, updateInterval);
  }, [metrics, updateInterval, setMetrics]);

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // GraphQL subscription for real-time updates (mock implementation)
  const subscribeToMetricsUpdates = useCallback(() => {
    // In a real implementation:
    // const subscription = client.subscribe({
    //   query: METRICS_UPDATED_SUBSCRIPTION,
    //   variables: { campaignIds: filters.campaigns }
    // }).subscribe({
    //   next: ({ data }) => {
    //     addMetrics(data.metricsUpdated);
    //   },
    //   error: (error) => {
    //     console.error('Subscription error:', error);
    //   }
    // });
    // return () => subscription.unsubscribe();

    // Mock subscription - in real app this would be WebSocket/GraphQL subscription
    console.log('Subscribed to metrics updates');
    return () => console.log('Unsubscribed from metrics updates');
  }, [filters.campaigns, addMetrics]);

  // Campaign performance comparison
  const compareCampaigns = useCallback(async (campaignIds: string[]) => {
    try {
      // In a real implementation:
      // const { data } = await client.query({
      //   query: COMPARE_CAMPAIGNS,
      //   variables: { campaignIds, dateRange: filters.dateRange }
      // });

      const comparisonData = metrics.filter(m => 
        campaignIds.includes(m.campaignId)
      );

      return comparisonData;
    } catch (error) {
      console.error('Failed to compare campaigns:', error);
      throw error;
    }
  }, [metrics, filters.dateRange]);

  // Platform performance comparison
  const comparePlatforms = useCallback(async (platforms: string[]) => {
    try {
      const comparisonData = metrics.filter(m => 
        platforms.includes(m.platform)
      );

      return comparisonData;
    } catch (error) {
      console.error('Failed to compare platforms:', error);
      throw error;
    }
  }, [metrics]);

  // Get campaign insights
  const getCampaignInsights = useCallback(async (campaignId: string) => {
    try {
      const campaignMetrics = metrics.filter(m => m.campaignId === campaignId);
      
      if (campaignMetrics.length === 0) return null;

      // Calculate insights
      const totalSpend = campaignMetrics.reduce((sum, m) => sum + m.spend, 0);
      const totalRevenue = campaignMetrics.reduce((sum, m) => sum + m.revenue, 0);
      const avgRoas = totalRevenue / totalSpend;
      const totalImpressions = campaignMetrics.reduce((sum, m) => sum + m.impressions, 0);
      const totalClicks = campaignMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const avgCtr = (totalClicks / totalImpressions) * 100;

      // Performance trend (last 7 days vs previous 7 days)
      const last7Days = campaignMetrics.slice(0, 7);
      const previous7Days = campaignMetrics.slice(7, 14);
      
      const last7DaysRoas = last7Days.reduce((sum, m) => sum + m.revenue, 0) / 
                           last7Days.reduce((sum, m) => sum + m.spend, 0);
      const previous7DaysRoas = previous7Days.reduce((sum, m) => sum + m.revenue, 0) / 
                               previous7Days.reduce((sum, m) => sum + m.spend, 0);
      
      const roasTrend = ((last7DaysRoas - previous7DaysRoas) / previous7DaysRoas) * 100;

      return {
        campaignId,
        totalSpend,
        totalRevenue,
        avgRoas,
        avgCtr,
        roasTrend,
        performance: roasTrend > 0 ? 'improving' : roasTrend < -5 ? 'declining' : 'stable',
        recommendations: generateRecommendations(avgRoas, avgCtr, roasTrend),
      };
    } catch (error) {
      console.error('Failed to get campaign insights:', error);
      throw error;
    }
  }, [metrics]);

  // Generate AI-powered recommendations
  const generateRecommendations = (roas: number, ctr: number, trend: number) => {
    const recommendations = [];

    if (roas < 2) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        message: 'ROAS is below target. Consider optimizing targeting or ad creative.',
        action: 'Review audience targeting and test new ad variations'
      });
    }

    if (ctr < 2) {
      recommendations.push({
        type: 'creative',
        priority: 'medium',
        message: 'CTR is below average. Your ads may need more compelling creative.',
        action: 'Test new headlines, images, or call-to-action buttons'
      });
    }

    if (trend < -10) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        message: 'Performance is declining. Consider pausing or reducing budget.',
        action: 'Analyze recent changes and consider budget reallocation'
      });
    }

    if (trend > 15) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        message: 'Performance is improving. Consider increasing budget.',
        action: 'Gradually increase daily budget by 20-30%'
      });
    }

    return recommendations;
  };

  // Initialize data on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => stopRealTimeUpdates();
  }, [isRealTimeEnabled, startRealTimeUpdates, stopRealTimeUpdates]);

  // Subscribe to GraphQL updates
  useEffect(() => {
    const unsubscribe = subscribeToMetricsUpdates();
    return unsubscribe;
  }, [subscribeToMetricsUpdates]);

  return {
    fetchAnalytics,
    compareCampaigns,
    comparePlatforms,
    getCampaignInsights,
    refreshData: fetchAnalytics,
  };
}; 