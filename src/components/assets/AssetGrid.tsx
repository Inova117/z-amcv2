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
  Play,
  Download,
  MoreHorizontal,
  Eye
} from 'lucide-react';

interface AssetGridProps {
  assets: Asset[];
  onAssetClick: (assetId: string) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onAssetClick,
}) => {
  const { selectedAssets, toggleAssetSelection } = useAssetStore();

  const getAssetIcon = (asset: Asset) => {
    switch (asset.type) {
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'document':
        return <FileText className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`
            group relative border rounded-lg overflow-hidden cursor-pointer transition-all
            hover:shadow-md hover:border-primary/50
            ${selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''}
          `}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedAssets.includes(asset.id)}
              onCheckedChange={() => toggleAssetSelection(asset.id)}
              className="bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* Asset Preview */}
          <div 
            className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden"
            onClick={() => onAssetClick(asset.id)}
          >
            {asset.type === 'image' && asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : asset.type === 'video' && asset.thumbnailUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-2">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                {getAssetIcon(asset)}
                <span className="text-xs mt-1 uppercase font-medium">
                  {asset.metadata.format || asset.type}
                </span>
              </div>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssetClick(asset.id);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle download
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Asset Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-sm truncate flex-1" title={asset.name}>
                {asset.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(asset.size)}</span>
                {asset.metadata.width && asset.metadata.height && (
                  <span>{asset.metadata.width}×{asset.metadata.height}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(asset.status)}`}
                >
                  {asset.status.replace('_', ' ')}
                </Badge>
                
                {asset.aiSuggestions.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {asset.aiSuggestions.length} AI tips
                  </Badge>
                )}
              </div>

              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {asset.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{asset.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 