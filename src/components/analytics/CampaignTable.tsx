import React, { useState, useMemo } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink
} from 'lucide-react';

type SortField = 'campaignName' | 'platform' | 'spend' | 'revenue' | 'roas' | 'impressions' | 'clicks' | 'ctr';
type SortDirection = 'asc' | 'desc';

const PLATFORM_COLORS = {
  google_ads: 'bg-blue-500',
  meta: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  twitter: 'bg-sky-500',
};

const PLATFORM_LABELS = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
};

export const CampaignTable: React.FC = () => {
  const { 
    getCampaignComparison, 
    compareMode, 
    selectedCampaigns, 
    setSelectedCampaigns 
  } = useAnalyticsStore();

  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const campaignData = getCampaignComparison();

  const filteredAndSortedData = useMemo(() => {
    let filtered = campaignData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(campaign =>
        campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.platform.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [campaignData, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    if (selectedCampaigns.includes(campaignId)) {
      setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId));
    } else {
      setSelectedCampaigns([...selectedCampaigns, campaignId]);
    }
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const getPerformanceIndicator = (roas: number) => {
    if (roas >= 4) return { icon: TrendingUp, color: 'text-green-500', label: 'Excellent' };
    if (roas >= 2) return { icon: TrendingUp, color: 'text-blue-500', label: 'Good' };
    if (roas >= 1) return { icon: Minus, color: 'text-yellow-500', label: 'Fair' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Poor' };
  };

  if (filteredAndSortedData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">No campaigns found</p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search terms' : 'Create some campaigns to see performance data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {compareMode && selectedCampaigns.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedCampaigns.length} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCampaigns([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {compareMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCampaigns.length === filteredAndSortedData.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCampaigns(filteredAndSortedData.map(c => c.campaignId));
                          } else {
                            setSelectedCampaigns([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('campaignName')}
                      className="h-auto p-0 font-semibold"
                    >
                      Campaign
                      <SortIcon field="campaignName" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('platform')}
                      className="h-auto p-0 font-semibold"
                    >
                      Platform
                      <SortIcon field="platform" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('spend')}
                      className="h-auto p-0 font-semibold"
                    >
                      Spend
                      <SortIcon field="spend" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('revenue')}
                      className="h-auto p-0 font-semibold"
                    >
                      Revenue
                      <SortIcon field="revenue" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('roas')}
                      className="h-auto p-0 font-semibold"
                    >
                      ROAS
                      <SortIcon field="roas" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('impressions')}
                      className="h-auto p-0 font-semibold"
                    >
                      Impressions
                      <SortIcon field="impressions" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('clicks')}
                      className="h-auto p-0 font-semibold"
                    >
                      Clicks
                      <SortIcon field="clicks" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('ctr')}
                      className="h-auto p-0 font-semibold"
                    >
                      CTR
                      <SortIcon field="ctr" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((campaign) => {
                  const performance = getPerformanceIndicator(campaign.roas);
                  const PerformanceIcon = performance.icon;
                  const platformColor = PLATFORM_COLORS[campaign.platform as keyof typeof PLATFORM_COLORS];
                  const platformLabel = PLATFORM_LABELS[campaign.platform as keyof typeof PLATFORM_LABELS];

                  return (
                    <TableRow 
                      key={campaign.campaignId}
                      className={selectedCampaigns.includes(campaign.campaignId) ? 'bg-muted/50' : ''}
                    >
                      {compareMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.campaignId)}
                            onCheckedChange={() => handleCampaignSelect(campaign.campaignId)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-medium">{campaign.campaignName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {campaign.campaignId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${platformColor}`} />
                          <span>{platformLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(campaign.spend)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(campaign.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={campaign.roas >= 3 ? "default" : "secondary"}>
                          {campaign.roas.toFixed(2)}x
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(campaign.impressions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(campaign.clicks)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(campaign.ctr)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <PerformanceIcon className={`h-4 w-4 ${performance.color}`} />
                          <span className={`text-xs ${performance.color}`}>
                            {performance.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Summary */}
      {compareMode && selectedCampaigns.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const selectedData = filteredAndSortedData.filter(c => 
                  selectedCampaigns.includes(c.campaignId)
                );
                const totalSpend = selectedData.reduce((sum, c) => sum + c.spend, 0);
                const totalRevenue = selectedData.reduce((sum, c) => sum + c.revenue, 0);
                const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                const totalImpressions = selectedData.reduce((sum, c) => sum + c.impressions, 0);
                const totalClicks = selectedData.reduce((sum, c) => sum + c.clicks, 0);
                const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

                return (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
                      <div className="text-sm text-muted-foreground">Total Spend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{avgRoas.toFixed(2)}x</div>
                      <div className="text-sm text-muted-foreground">Average ROAS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatPercentage(avgCtr)}</div>
                      <div className="text-sm text-muted-foreground">Average CTR</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 