import React from 'react';
import { useAssetStore } from '@/store/assetStore';
import { Asset } from '@/types/asset';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Image, 
  Video, 
  FileText, 
  File, 
  Download,
  MoreHorizontal,
  Eye
} from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  onAssetClick: (assetId: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  onAssetClick,
}) => {
  const { selectedAssets, toggleAssetSelection } = useAssetStore();

  const getAssetIcon = (asset: Asset) => {
    switch (asset.type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
        <div className="col-span-1">
          <Checkbox />
        </div>
        <div className="col-span-4">Name</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Asset Rows */}
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`
            grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors
            ${selectedAssets.includes(asset.id) ? 'bg-primary/5 border-l-2 border-primary' : ''}
          `}
          onClick={() => onAssetClick(asset.id)}
        >
          <div className="col-span-1 flex items-center">
            <Checkbox
              checked={selectedAssets.includes(asset.id)}
              onCheckedChange={() => toggleAssetSelection(asset.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="col-span-4 flex items-center gap-3 min-w-0">
            {asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                {getAssetIcon(asset)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{asset.name}</p>
              {asset.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {asset.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 flex items-center">
            <Badge variant="outline" className="text-xs">
              {asset.type}
            </Badge>
          </div>

          <div className="col-span-1 flex items-center text-sm text-muted-foreground">
            {formatFileSize(asset.size)}
          </div>

          <div className="col-span-2 flex items-center">
            <Badge 
              variant={asset.status === 'approved' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {asset.status.replace('_', ' ')}
            </Badge>
            {asset.aiSuggestions.length > 0 && (
              <Badge variant="outline" className="text-xs ml-2">
                {asset.aiSuggestions.length} AI tips
              </Badge>
            )}
          </div>

          <div className="col-span-2 flex items-center text-sm text-muted-foreground">
            {formatDate(asset.updatedAt)}
          </div>

          <div className="col-span-1 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAssetClick(asset.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle download
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}; 