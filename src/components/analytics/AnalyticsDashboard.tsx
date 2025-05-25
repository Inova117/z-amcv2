import React, { useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAnalyticsOperations } from '@/hooks/useAnalyticsOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Play,
  Pause,
  Filter
} from 'lucide-react';
import { MetricsOverview } from './MetricsOverview';
import { PerformanceCharts } from './PerformanceCharts';
import { PlatformComparison } from './PlatformComparison';
import { CampaignTable } from './CampaignTable';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ExportDialog } from './ExportDialog';
import { RealTimeIndicator } from './RealTimeIndicator';

export const AnalyticsDashboard: React.FC = () => {
  const {
    metrics,
    isLoading,
    lastUpdated,
    viewMode,
    chartType,
    compareMode,
    isRealTimeEnabled,
    isExporting,
    setViewMode,
    setChartType,
    toggleCompareMode,
    toggleRealTime,
    getAggregatedData,
  } = useAnalyticsStore();

  const { refreshData } = useAnalyticsOperations();

  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const aggregatedData = getAggregatedData();

  const handleRefresh = async () => {
    await refreshData();
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time campaign performance and insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RealTimeIndicator />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
            >
              {isRealTimeEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Live
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Live
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b bg-muted/50 p-4">
          <AnalyticsFilters />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="h-full flex flex-col">
          <div className="border-b px-6 py-3">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Key Metrics */}
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
                    <p className="text-xs text-muted-foreground">
                      Across all campaigns
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Total ad views
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      CTR: {formatPercentage(aggregatedData.ctr || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(aggregatedData.roas || 0).toFixed(2)}x
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Return on ad spend
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Performance Trends</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={chartType === 'line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('line')}
                      >
                        <LineChart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={chartType === 'bar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={chartType === 'area' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('area')}
                      >
                        <PieChart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PerformanceCharts />
                  </CardContent>
                </Card>
              </div>

              {/* Metrics Overview */}
              <MetricsOverview />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Campaign Performance</h2>
                <Button
                  variant={compareMode ? 'default' : 'outline'}
                  onClick={toggleCompareMode}
                >
                  {compareMode ? 'Exit Compare' : 'Compare Campaigns'}
                </Button>
              </div>
              <CampaignTable />
            </TabsContent>

            <TabsContent value="platforms" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Platform Comparison</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Google Ads</Badge>
                  <Badge variant="outline">Meta</Badge>
                  <Badge variant="outline">LinkedIn</Badge>
                </div>
              </div>
              <PlatformComparison />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Export Dialog */}
      <ExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog} 
      />
    </div>
  );
}; 