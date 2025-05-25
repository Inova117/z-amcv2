import React from 'react';
import { useAssetStore } from '@/store/assetStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, Home } from 'lucide-react';

export const FolderTree: React.FC = () => {
  const { folders, currentFolder, setCurrentFolder, setFilter } = useAssetStore();

  const handleFolderClick = (folderId?: string) => {
    const folder = folders.find(f => f.id === folderId);
    setCurrentFolder(folder || null);
    setFilter({ folderId });
  };

  return (
    <div className="p-4">
      <h3 className="font-medium mb-3">Folders</h3>
      
      <div className="space-y-1">
        {/* All Assets */}
        <Button
          variant={!currentFolder ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFolderClick()}
        >
          <Home className="h-4 w-4 mr-2" />
          All Assets
        </Button>

        {/* Demo Folders */}
        {[
          { id: 'images', name: 'Images', count: 12 },
          { id: 'videos', name: 'Videos', count: 5 },
          { id: 'campaigns', name: 'Campaign Assets', count: 8 },
          { id: 'brand', name: 'Brand Assets', count: 15 },
        ].map((folder) => (
          <Button
            key={folder.id}
            variant={currentFolder?.id === folder.id ? 'secondary' : 'ghost'}
            className="w-full justify-between"
            onClick={() => handleFolderClick(folder.id)}
          >
            <div className="flex items-center">
              <Folder className="h-4 w-4 mr-2" />
              {folder.name}
            </div>
            <Badge variant="outline" className="text-xs">
              {folder.count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
}; 