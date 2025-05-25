import React from 'react';
import { useAssetStore } from '@/store/assetStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export const AssetFilters: React.FC = () => {
  const { filter, setFilter, clearFilter } = useAssetStore();

  const assetTypes = [
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Documents' },
    { value: 'other', label: 'Other' },
  ];

  const assetStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filter.type || [];
    const newTypes = checked
      ? [...currentTypes, type as any]
      : currentTypes.filter(t => t !== type);
    setFilter({ type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filter.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status as any]
      : currentStatuses.filter(s => s !== status);
    setFilter({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const activeFiltersCount = 
    (filter.type?.length || 0) + 
    (filter.status?.length || 0) + 
    (filter.tags?.length || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
            <Button variant="ghost" size="sm" onClick={clearFilter}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Asset Types */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Asset Type</Label>
          <div className="space-y-2">
            {assetTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filter.type?.includes(type.value as any) || false}
                  onCheckedChange={(checked) => 
                    handleTypeChange(type.value, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Status</Label>
          <div className="space-y-2">
            {assetStatuses.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filter.status?.includes(status.value as any) || false}
                  onCheckedChange={(checked) => 
                    handleStatusChange(status.value, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`status-${status.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Tags</Label>
          <div className="text-sm text-muted-foreground">
            Tag filtering will be available once assets are loaded
          </div>
        </div>
      </div>
    </div>
  );
}; 