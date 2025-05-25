import React from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Users,
  ShoppingCart
} from 'lucide-react';

export const MetricsOverview: React.FC = () => {
  const { getAggregatedData, getFilteredMetrics } = useAnalyticsStore();
  
  const aggregatedData = getAggregatedData();
  const metrics = getFilteredMetrics();

  // Calculate trends (comparing last 7 days vs previous 7 days)
  const calculateTrend = (metricKey: string): { trend: number; direction: 'up' | 'down' | 'stable' } => {
    if (metrics.length < 14) return { trend: 0, direction: 'stable' as const };

    const sortedMetrics = metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last7Days = sortedMetrics.slice(0, 7);
    const previous7Days = sortedMetrics.slice(7, 14);

    const lastValue = last7Days.reduce((sum, m) => sum + (m as any)[metricKey], 0);
    const previousValue = previous7Days.reduce((sum, m) => sum + (m as any)[metricKey], 0);

    if (previousValue === 0) return { trend: 0, direction: 'stable' as const };

    const trendPercentage = ((lastValue - previousValue) / previousValue) * 100;
    
    const direction: 'up' | 'down' | 'stable' = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
    
    return {
      trend: Math.abs(trendPercentage),
      direction
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'stable' }) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const spendTrend = calculateTrend('spend');
  const impressionsTrend = calculateTrend('impressions');
  const clicksTrend = calculateTrend('clicks');
  const revenueTrend = calculateTrend('revenue');

  // Performance indicators
  const performanceMetrics = [
    {
      title: 'Cost Efficiency',
      value: aggregatedData.cpc || 0,
      format: 'currency',
      description: 'Cost per click',
      target: 2.5,
      icon: DollarSign,
    },
    {
      title: 'Engagement Rate',
      value: aggregatedData.ctr || 0,
      format: 'percentage',
      description: 'Click-through rate',
      target: 3.0,
      icon: MousePointer,
    },
    {
      title: 'Return on Investment',
      value: aggregatedData.roas || 0,
      format: 'multiplier',
      description: 'Return on ad spend',
      target: 4.0,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(aggregatedData.spend || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon direction={spendTrend.direction} />
              <span className={getTrendColor(spendTrend.direction)}>
                {spendTrend.trend.toFixed(1)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(aggregatedData.impressions || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon direction={impressionsTrend.direction} />
              <span className={getTrendColor(impressionsTrend.direction)}>
                {impressionsTrend.trend.toFixed(1)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(aggregatedData.clicks || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon direction={clicksTrend.direction} />
              <span className={getTrendColor(clicksTrend.direction)}>
                {clicksTrend.trend.toFixed(1)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(aggregatedData.revenue || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon direction={revenueTrend.direction} />
              <span className={getTrendColor(revenueTrend.direction)}>
                {revenueTrend.trend.toFixed(1)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;
          const progress = Math.min((metric.value / metric.target) * 100, 100);
          const isGood = metric.value >= metric.target;

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {metric.format === 'currency' 
                      ? formatCurrency(metric.value)
                      : metric.format === 'percentage'
                      ? formatPercentage(metric.value)
                      : `${metric.value.toFixed(2)}x`
                    }
                  </div>
                  <Badge variant={isGood ? "default" : "secondary"}>
                    {isGood ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{metric.description}</span>
                    <span>Target: {
                      metric.format === 'currency' 
                        ? formatCurrency(metric.target)
                        : metric.format === 'percentage'
                        ? formatPercentage(metric.target)
                        : `${metric.target.toFixed(2)}x`
                    }</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 