import React from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const PLATFORM_OPTIONS = [
  { value: 'google_ads', label: 'Google Ads', color: 'bg-blue-500' },
  { value: 'meta', label: 'Meta', color: 'bg-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
];

const METRIC_OPTIONS = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'spend', label: 'Spend' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'roas', label: 'ROAS' },
];

export const AnalyticsFilters: React.FC = () => {
  const {
    filters,
    metrics,
    updateFilters,
    getFilteredMetrics,
  } = useAnalyticsStore();

  const filteredMetrics = getFilteredMetrics();
  const availableCampaigns = Array.from(
    new Set(metrics.map(m => ({ id: m.campaignId, name: m.campaignName })))
  );

  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    
    updateFilters({ platforms: newPlatforms });
  };

  const handleCampaignToggle = (campaignId: string) => {
    const newCampaigns = filters.campaigns.includes(campaignId)
      ? filters.campaigns.filter(c => c !== campaignId)
      : [...filters.campaigns, campaignId];
    
    updateFilters({ campaigns: newCampaigns });
  };

  const handleMetricToggle = (metric: string) => {
    const newMetrics = filters.metrics.includes(metric)
      ? filters.metrics.filter(m => m !== metric)
      : [...filters.metrics, metric];
    
    updateFilters({ metrics: newMetrics });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | undefined) => {
    if (date) {
      updateFilters({
        dateRange: {
          ...filters.dateRange,
          [field]: date.toISOString().split('T')[0],
        },
      });
    }
  };

  const clearAllFilters = () => {
    updateFilters({
      platforms: [],
      campaigns: [],
      metrics: ['impressions', 'clicks', 'spend', 'roas'],
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    });
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    updateFilters({
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredMetrics.length} results
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          
          {/* Quick Date Buttons */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(7)}
            >
              7d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(14)}
            >
              14d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(30)}
            >
              30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(90)}
            >
              90d
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(filters.dateRange.start), 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(filters.dateRange.start)}
                  onSelect={(date) => handleDateRangeChange('start', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(filters.dateRange.end), 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(filters.dateRange.end)}
                  onSelect={(date) => handleDateRangeChange('end', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Platforms</Label>
          <div className="space-y-2">
            {PLATFORM_OPTIONS.map((platform) => (
              <div key={platform.value} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.value}
                  checked={filters.platforms.includes(platform.value)}
                  onCheckedChange={() => handlePlatformToggle(platform.value)}
                />
                <label
                  htmlFor={platform.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                  {platform.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Campaigns</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center space-x-2">
                <Checkbox
                  id={campaign.id}
                  checked={filters.campaigns.includes(campaign.id)}
                  onCheckedChange={() => handleCampaignToggle(campaign.id)}
                />
                <label
                  htmlFor={campaign.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                  title={campaign.name}
                >
                  {campaign.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Metrics</Label>
          <div className="space-y-2">
            {METRIC_OPTIONS.map((metric) => (
              <div key={metric.value} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.value}
                  checked={filters.metrics.includes(metric.value)}
                  onCheckedChange={() => handleMetricToggle(metric.value)}
                />
                <label
                  htmlFor={metric.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.platforms.length > 0 || filters.campaigns.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Filters</Label>
          <div className="flex flex-wrap gap-2">
            {filters.platforms.map((platform) => {
              const platformOption = PLATFORM_OPTIONS.find(p => p.value === platform);
              return (
                <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${platformOption?.color}`} />
                  {platformOption?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handlePlatformToggle(platform)}
                  />
                </Badge>
              );
            })}
            
            {filters.campaigns.map((campaignId) => {
              const campaign = availableCampaigns.find(c => c.id === campaignId);
              return (
                <Badge key={campaignId} variant="secondary" className="flex items-center gap-1">
                  {campaign?.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleCampaignToggle(campaignId)}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 