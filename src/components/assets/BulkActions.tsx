import React from 'react';
import { useAssetStore } from '@/store/assetStore';
import { useAssetOperations } from '@/hooks/useAssetOperations';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal,
  Trash2,
  Check,
  X,
  Archive,
  Tag,
  Move
} from 'lucide-react';

export const BulkActions: React.FC = () => {
  const { selectedAssets } = useAssetStore();
  const { bulkUpdateAssets } = useAssetOperations();

  const handleBulkAction = async (action: string) => {
    await bulkUpdateAssets({
      action: action as any,
      assetIds: selectedAssets,
    });
  };

  if (selectedAssets.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4 mr-2" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleBulkAction('approve')}>
          <Check className="h-4 w-4 mr-2" />
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBulkAction('reject')}>
          <X className="h-4 w-4 mr-2" />
          Reject
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 