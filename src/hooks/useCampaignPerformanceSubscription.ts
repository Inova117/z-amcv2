import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for campaign performance data
export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  platform: 'google_ads' | 'meta' | 'linkedin' | 'twitter';
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  timestamp: string;
  date: string;
}

export interface CampaignMetricsUpdate {
  projectId: string;
  campaignId: string;
  metrics: CampaignMetrics;
  timestamp: string;
}

export interface CampaignPerformanceAlert {
  alertId: string;
  projectId: string;
  campaignId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
}

// GraphQL subscription queries (in a real app, these would be imported from a GraphQL file)
const CAMPAIGN_METRICS_SUBSCRIPTION = `
  subscription CampaignMetricsUpdated($projectId: ID!) {
    campaignMetricsUpdated(projectId: $projectId) {
      projectId
      campaignId
      metrics {
        campaignId
        campaignName
        platform
        impressions
        clicks
        spend
        conversions
        revenue
        ctr
        cpc
        cpm
        roas
        timestamp
        date
      }
      timestamp
    }
  }
`;

const CAMPAIGN_PERFORMANCE_ALERT_SUBSCRIPTION = `
  subscription CampaignPerformanceAlert($projectId: ID!) {
    campaignPerformanceAlert(projectId: $projectId) {
      alertId
      projectId
      campaignId
      alertType
      severity
      message
      threshold
      currentValue
      timestamp
    }
  }
`;

// Mock WebSocket connection for demo purposes
class MockWebSocketConnection {
  private listeners: Map<string, (data: any) => void> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate connection delay
      setTimeout(() => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('Mock WebSocket connected to:', url);
        resolve();
      }, 100);
    });
  }

  subscribe(query: string, variables: any, callback: (data: any) => void): string {
    const subscriptionId = Math.random().toString(36).substr(2, 9);
    this.listeners.set(subscriptionId, callback);
    
    // Start generating mock data for demo
    if (query.includes('campaignMetricsUpdated')) {
      this.startMockMetricsUpdates(subscriptionId, variables.projectId);
    } else if (query.includes('campaignPerformanceAlert')) {
      this.startMockAlerts(subscriptionId, variables.projectId);
    }
    
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.listeners.delete(subscriptionId);
  }

  disconnect(): void {
    this.isConnected = false;
    this.listeners.clear();
  }

  private startMockMetricsUpdates(subscriptionId: string, projectId: string): void {
    const campaigns = [
      { id: 'demo_summer_sale_2024', name: 'Summer Sale 2024', platform: 'google_ads' },
      { id: 'demo_brand_awareness_q4', name: 'Brand Awareness Q4', platform: 'meta' },
      { id: 'demo_product_launch', name: 'Product Launch Campaign', platform: 'linkedin' },
    ];

    const generateMetricsUpdate = () => {
      if (!this.listeners.has(subscriptionId)) return;

      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
      const baseImpressions = Math.floor(Math.random() * 5000) + 1000;
      const clicks = Math.floor(baseImpressions * (Math.random() * 0.06 + 0.02)); // 2-8% CTR
      const spend = Math.random() * 200 + 50;
      const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.05)); // 5-15% conversion
      const revenue = conversions * (Math.random() * 75 + 25); // $25-100 per conversion

      const metrics: CampaignMetrics = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: campaign.platform as any,
        impressions: baseImpressions,
        clicks,
        spend,
        conversions,
        revenue,
        ctr: (clicks / baseImpressions) * 100,
        cpc: spend / clicks,
        cpm: (spend / baseImpressions) * 1000,
        roas: revenue / spend,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };

      const update: CampaignMetricsUpdate = {
        projectId,
        campaignId: campaign.id,
        metrics,
        timestamp: new Date().toISOString(),
      };

      const callback = this.listeners.get(subscriptionId);
      if (callback) {
        callback({ campaignMetricsUpdated: update });
      }
    };

    // Generate updates every 5-15 seconds
    const interval = setInterval(() => {
      generateMetricsUpdate();
    }, Math.random() * 10000 + 5000);

    // Clean up interval when subscription is removed
    const originalDelete = this.listeners.delete.bind(this.listeners);
    this.listeners.delete = (key: string) => {
      if (key === subscriptionId) {
        clearInterval(interval);
      }
      return originalDelete(key);
    };
  }

  private startMockAlerts(subscriptionId: string, projectId: string): void {
    const alertTypes = [
      { type: 'budget_exceeded', severity: 'high', message: 'Campaign budget exceeded by 15%' },
      { type: 'low_performance', severity: 'medium', message: 'ROAS below threshold (1.8)' },
      { type: 'high_cpc', severity: 'medium', message: 'Cost per click above $2.50' },
      { type: 'low_ctr', severity: 'low', message: 'Click-through rate below 1%' },
    ];

    const generateAlert = () => {
      if (!this.listeners.has(subscriptionId)) return;

      // Generate alerts less frequently than metrics
      if (Math.random() > 0.3) return;

      const alertTemplate = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const campaignId = `demo_campaign_${Math.floor(Math.random() * 3) + 1}`;

      const alert: CampaignPerformanceAlert = {
        alertId: Math.random().toString(36).substr(2, 9),
        projectId,
        campaignId,
        alertType: alertTemplate.type,
        severity: alertTemplate.severity as any,
        message: alertTemplate.message,
        threshold: Math.random() * 5 + 1,
        currentValue: Math.random() * 3 + 0.5,
        timestamp: new Date().toISOString(),
      };

      const callback = this.listeners.get(subscriptionId);
      if (callback) {
        callback({ campaignPerformanceAlert: alert });
      }
    };

    // Generate alerts every 15-30 seconds
    const interval = setInterval(() => {
      generateAlert();
    }, Math.random() * 15000 + 15000);

    // Clean up interval when subscription is removed
    const originalDelete = this.listeners.delete.bind(this.listeners);
    this.listeners.delete = (key: string) => {
      if (key === subscriptionId) {
        clearInterval(interval);
      }
      return originalDelete(key);
    };
  }
}

// Global mock WebSocket instance
const mockWebSocket = new MockWebSocketConnection();

export interface UseCampaignPerformanceSubscriptionOptions {
  projectId: string;
  onMetricsUpdate?: (update: CampaignMetricsUpdate) => void;
  onPerformanceAlert?: (alert: CampaignPerformanceAlert) => void;
  enableToasts?: boolean;
}

export const useCampaignPerformanceSubscription = ({
  projectId,
  onMetricsUpdate,
  onPerformanceAlert,
  enableToasts = true,
}: UseCampaignPerformanceSubscriptionOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [metricsUpdates, setMetricsUpdates] = useState<CampaignMetricsUpdate[]>([]);
  const [alerts, setAlerts] = useState<CampaignPerformanceAlert[]>([]);
  
  const subscriptionIds = useRef<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    const connect = async () => {
      try {
        setConnectionError(null);
        
        // Connect to WebSocket (in real app, this would be GraphQL subscription endpoint)
        await mockWebSocket.connect(`ws://localhost:4000/graphql`);
        
        if (!mounted) return;
        
        setIsConnected(true);

        // Subscribe to metrics updates
        const metricsSubscriptionId = mockWebSocket.subscribe(
          CAMPAIGN_METRICS_SUBSCRIPTION,
          { projectId },
          (data) => {
            if (!mounted) return;
            
            const update = data.campaignMetricsUpdated;
            setMetricsUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
            
            if (onMetricsUpdate) {
              onMetricsUpdate(update);
            }

            if (enableToasts) {
              toast({
                title: "Campaign Metrics Updated",
                description: `${update.metrics.campaignName}: $${update.metrics.spend.toFixed(2)} spent, ROAS ${update.metrics.roas.toFixed(2)}`,
                duration: 3000,
              });
            }
          }
        );

        // Subscribe to performance alerts
        const alertsSubscriptionId = mockWebSocket.subscribe(
          CAMPAIGN_PERFORMANCE_ALERT_SUBSCRIPTION,
          { projectId },
          (data) => {
            if (!mounted) return;
            
            const alert = data.campaignPerformanceAlert;
            setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
            
            if (onPerformanceAlert) {
              onPerformanceAlert(alert);
            }

            if (enableToasts) {
              const variant = alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default';
              toast({
                title: "Campaign Performance Alert",
                description: alert.message,
                variant,
                duration: 5000,
              });
            }
          }
        );

        subscriptionIds.current = [metricsSubscriptionId, alertsSubscriptionId];

      } catch (error) {
        if (!mounted) return;
        
        console.error('Failed to connect to campaign performance subscription:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      mounted = false;
      
      // Unsubscribe from all subscriptions
      subscriptionIds.current.forEach(id => {
        mockWebSocket.unsubscribe(id);
      });
      subscriptionIds.current = [];
      
      setIsConnected(false);
    };
  }, [projectId, onMetricsUpdate, onPerformanceAlert, enableToasts, toast]);

  const reconnect = async () => {
    setConnectionError(null);
    setIsConnected(false);
    
    // Trigger reconnection by updating a dependency
    // In a real app, this would restart the WebSocket connection
    window.location.reload();
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const clearMetricsHistory = () => {
    setMetricsUpdates([]);
  };

  return {
    isConnected,
    connectionError,
    metricsUpdates,
    alerts,
    reconnect,
    clearAlerts,
    clearMetricsHistory,
    
    // Statistics
    totalMetricsUpdates: metricsUpdates.length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    highAlerts: alerts.filter(a => a.severity === 'high').length,
    
    // Latest data
    latestMetrics: metricsUpdates[0]?.metrics,
    latestAlert: alerts[0],
  };
}; 