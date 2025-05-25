import React, { useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values for Excel/Sheets',
    icon: FileSpreadsheet,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Formatted report for sharing',
    icon: FileText,
  },
];

const EXPORT_METRICS = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'spend', label: 'Spend' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'roas', label: 'ROAS' },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange }) => {
  const { 
    exportData, 
    isExporting, 
    getFilteredMetrics,
    filters 
  } = useAnalyticsStore();

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'impressions', 'clicks', 'spend', 'roas'
  ]);
  const [includeFilters, setIncludeFilters] = useState(true);

  const filteredMetrics = getFilteredMetrics();

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleExport = async () => {
    try {
      await exportData(selectedFormat);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.platforms.length > 0) count++;
    if (filters.campaigns.length > 0) count++;
    if (filters.dateRange.start !== filters.dateRange.end) count++;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Data
          </DialogTitle>
          <DialogDescription>
            Export your campaign analytics data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Data to Export</span>
              <Badge variant="secondary">
                {filteredMetrics.length} records
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Date range: {filters.dateRange.start} to {filters.dateRange.end}
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2">
                  • {getActiveFiltersCount()} filter(s) applied
                </span>
              )}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup 
              value={selectedFormat} 
              onValueChange={(value: 'csv' | 'pdf') => setSelectedFormat(value)}
            >
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <div key={format.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={format.value} id={format.value} />
                    <label
                      htmlFor={format.value}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {format.description}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Metrics Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Metrics</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_METRICS.map((metric) => (
                <div key={metric.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${metric.value}`}
                    checked={selectedMetrics.includes(metric.value)}
                    onCheckedChange={() => handleMetricToggle(metric.value)}
                  />
                  <label
                    htmlFor={`export-${metric.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {metric.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-filters"
                checked={includeFilters}
                onCheckedChange={(checked) => setIncludeFilters(checked as boolean)}
              />
              <label
                htmlFor="include-filters"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include filter information in export
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedMetrics.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 