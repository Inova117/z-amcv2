import React, { useEffect, useState } from 'react';
import { useAssetStore } from '@/store/assetStore';
import { useAssetOperations } from '@/hooks/useAssetOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  FolderPlus,
  Download,
  Trash2,
  Check,
  X,
  Archive,
  Tag,
  Move,
  MoreHorizontal
} from 'lucide-react';
import { AssetUploadZone } from './AssetUploadZone';
import { AssetGrid } from './AssetGrid';
import { AssetList } from './AssetList';
import { AssetFilters } from './AssetFilters';
import { AssetDetails } from './AssetDetails';
import { BulkActions } from './BulkActions';
import { FolderTree } from './FolderTree';
import { UploadProgress } from './UploadProgress';

export const AssetManager: React.FC = () => {
  const {
    assets,
    selectedAssets,
    currentFolder,
    uploads,
    filter,
    isLoading,
    viewMode,
    setViewMode,
    clearSelection,
  } = useAssetStore();

  const { createFolder } = useAssetOperations();
  
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = !filter.folderId || asset.folderId === filter.folderId;
    const matchesType = !filter.type?.length || filter.type.includes(asset.type);
    const matchesStatus = !filter.status?.length || filter.status.includes(asset.status);
    const matchesTags = !filter.tags?.length || 
      filter.tags.some(tag => asset.tags.includes(tag));
    
    return matchesSearch && matchesFolder && matchesType && matchesStatus && matchesTags;
  });

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      await createFolder(name, currentFolder?.id);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Asset Manager</h1>
            <p className="text-muted-foreground">
              Manage your marketing assets with AI-powered insights
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUploadZone(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {selectedAssets.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedAssets.length} selected
              </Badge>
              <BulkActions />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b bg-muted/50 p-4">
          <AssetFilters />
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="border-b bg-blue-50 p-4">
          <UploadProgress uploads={uploads} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <div className="w-64 border-r bg-muted/50 overflow-y-auto">
          <FolderTree />
        </div>

        {/* Asset Grid/List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || Object.keys(filter).length > 2
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first asset to get started'
                  }
                </p>
                <Button onClick={() => setShowUploadZone(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Assets
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{filteredAssets.length} assets</span>
                  {currentFolder && (
                    <span>in {currentFolder.name}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {filteredAssets.filter(a => a.status === 'approved').length} approved
                  </span>
                  <span>•</span>
                  <span>
                    {filteredAssets.filter(a => a.status === 'pending_review').length} pending
                  </span>
                </div>
              </div>

              {/* Asset Display */}
              {viewMode === 'grid' ? (
                <AssetGrid 
                  assets={filteredAssets}
                  onAssetClick={setSelectedAsset}
                />
              ) : (
                <AssetList 
                  assets={filteredAssets}
                  onAssetClick={setSelectedAsset}
                />
              )}
            </div>
          )}
        </div>

        {/* Asset Details Sidebar */}
        {selectedAsset && (
          <div className="w-96 border-l bg-background overflow-y-auto">
            <AssetDetails 
              assetId={selectedAsset}
              onClose={() => setSelectedAsset(null)}
            />
          </div>
        )}
      </div>

      {/* Upload Zone Modal */}
      {showUploadZone && (
        <AssetUploadZone 
          onClose={() => setShowUploadZone(false)}
          folderId={currentFolder?.id}
        />
      )}
    </div>
  );
}; 