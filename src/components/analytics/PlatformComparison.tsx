import React from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PLATFORM_COLORS = {
  google_ads: '#4285F4',
  meta: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
};

const PLATFORM_LABELS = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
};

export const PlatformComparison: React.FC = () => {
  const { getPlatformComparison } = useAnalyticsStore();
  
  const platformData = getPlatformComparison();

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{PLATFORM_LABELS[label as keyof typeof PLATFORM_LABELS] || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.dataKey === 'spend' || entry.dataKey === 'revenue' || entry.dataKey === 'cpc'
                  ? formatCurrency(entry.value)
                  : entry.dataKey === 'ctr' || entry.dataKey === 'roas'
                  ? entry.dataKey === 'ctr' 
                    ? formatPercentage(entry.value)
                    : `${entry.value.toFixed(2)}x`
                  : formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for charts
  const chartData = platformData.map(platform => ({
    ...platform,
    name: PLATFORM_LABELS[platform.platform as keyof typeof PLATFORM_LABELS] || platform.platform,
  }));

  // Calculate totals for pie charts
  const totalSpend = platformData.reduce((sum, p) => sum + p.spend, 0);
  const totalRevenue = platformData.reduce((sum, p) => sum + p.revenue, 0);

  const spendPieData = platformData.map(platform => ({
    name: PLATFORM_LABELS[platform.platform as keyof typeof PLATFORM_LABELS] || platform.platform,
    value: platform.spend,
    percentage: totalSpend > 0 ? (platform.spend / totalSpend) * 100 : 0,
  }));

  const revenuePieData = platformData.map(platform => ({
    name: PLATFORM_LABELS[platform.platform as keyof typeof PLATFORM_LABELS] || platform.platform,
    value: platform.revenue,
    percentage: totalRevenue > 0 ? (platform.revenue / totalRevenue) * 100 : 0,
  }));

  if (platformData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No platform data available</p>
          <p className="text-sm">Run some campaigns to see platform comparisons</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Platform</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">ROAS</th>
                  <th className="text-right py-2">Impressions</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">CPC</th>
                </tr>
              </thead>
              <tbody>
                {platformData.map((platform) => (
                  <tr key={platform.platform} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PLATFORM_COLORS[platform.platform as keyof typeof PLATFORM_COLORS] }}
                        />
                        <span className="font-medium">
                          {PLATFORM_LABELS[platform.platform as keyof typeof PLATFORM_LABELS] || platform.platform}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3">{formatCurrency(platform.spend)}</td>
                    <td className="text-right py-3">{formatCurrency(platform.revenue)}</td>
                    <td className="text-right py-3">
                      <Badge variant={platform.roas >= 3 ? "default" : "secondary"}>
                        {platform.roas.toFixed(2)}x
                      </Badge>
                    </td>
                    <td className="text-right py-3">{formatNumber(platform.impressions)}</td>
                    <td className="text-right py-3">{formatNumber(platform.clicks)}</td>
                    <td className="text-right py-3">{formatPercentage(platform.ctr)}</td>
                    <td className="text-right py-3">{formatCurrency(platform.cpc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend vs Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spend vs Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="spend" fill="#ef4444" name="Spend" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ROAS Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>ROAS by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="roas" 
                    fill="#3b82f6" 
                    name="ROAS" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spend Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spend Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendPieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PLATFORM_COLORS[platformData[index]?.platform as keyof typeof PLATFORM_COLORS] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Spend']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {platformData.map((platform) => {
              const platformName = PLATFORM_LABELS[platform.platform as keyof typeof PLATFORM_LABELS] || platform.platform;
              const platformColor = PLATFORM_COLORS[platform.platform as keyof typeof PLATFORM_COLORS];
              
              return (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: platformColor }}
                      />
                      <span className="font-medium">{platformName}</span>
                    </div>
                    <Badge variant={platform.roas >= 3 ? "default" : "secondary"}>
                      {platform.roas.toFixed(2)}x ROAS
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">CTR</div>
                      <div className="font-medium">{formatPercentage(platform.ctr)}</div>
                      <Progress 
                        value={Math.min(platform.ctr * 10, 100)} 
                        className="h-1 mt-1"
                      />
                    </div>
                    <div>
                      <div className="text-muted-foreground">CPC</div>
                      <div className="font-medium">{formatCurrency(platform.cpc)}</div>
                      <Progress 
                        value={Math.min((5 - platform.cpc) * 20, 100)} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 