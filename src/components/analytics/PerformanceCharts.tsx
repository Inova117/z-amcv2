import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { format, parseISO } from 'date-fns';

export const PerformanceCharts: React.FC = () => {
  const { 
    chartType, 
    getFilteredMetrics,
    filters 
  } = useAnalyticsStore();

  const chartData = useMemo(() => {
    const metrics = getFilteredMetrics();
    
    // Group metrics by date and aggregate
    const groupedData = metrics.reduce((acc, metric) => {
      const date = metric.date;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      
      acc[date].impressions += metric.impressions;
      acc[date].clicks += metric.clicks;
      acc[date].spend += metric.spend;
      acc[date].conversions += metric.conversions;
      acc[date].revenue += metric.revenue;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate derived metrics
    const chartArray = Object.values(groupedData).map((data: any) => ({
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
      roas: data.spend > 0 ? data.revenue / data.spend : 0,
      formattedDate: format(parseISO(data.date), 'MMM dd'),
    }));

    // Sort by date
    return chartArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [getFilteredMetrics]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
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

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              stroke="#8884d8"
              strokeWidth={2}
              name="Impressions"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Clicks"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="spend"
              stroke="#ffc658"
              strokeWidth={2}
              name="Spend"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#ff7300"
              strokeWidth={2}
              name="Revenue"
              dot={{ r: 4 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="impressions"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
              name="Impressions"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
              name="Clicks"
            />
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="impressions"
              fill="#8884d8"
              name="Impressions"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="clicks"
              fill="#82ca9d"
              name="Clicks"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="spend"
              fill="#ffc658"
              name="Spend"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Adjust your filters to see performance data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}; 