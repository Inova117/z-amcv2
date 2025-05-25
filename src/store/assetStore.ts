import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Asset, AssetFilter, AssetUpload, AssetFolder, AssetBulkAction } from '@/types/asset';

interface AssetStore {
  // State
  assets: Asset[];
  selectedAssets: string[];
  currentAsset: Asset | null;
  folders: AssetFolder[];
  currentFolder: AssetFolder | null;
  uploads: AssetUpload[];
  filter: AssetFilter;
  isLoading: boolean;
  isUploading: boolean;
  viewMode: 'grid' | 'list';
  
  // Actions
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  setCurrentAsset: (asset: Asset | null) => void;
  
  // Selection
  selectAsset: (id: string) => void;
  deselectAsset: (id: string) => void;
  selectAllAssets: () => void;
  clearSelection: () => void;
  toggleAssetSelection: (id: string) => void;
  
  // Folders
  setFolders: (folders: AssetFolder[]) => void;
  setCurrentFolder: (folder: AssetFolder | null) => void;
  addFolder: (folder: AssetFolder) => void;
  updateFolder: (id: string, updates: Partial<AssetFolder>) => void;
  
  // Uploads
  addUpload: (upload: AssetUpload) => void;
  updateUpload: (index: number, updates: Partial<AssetUpload>) => void;
  removeUpload: (index: number) => void;
  clearUploads: () => void;
  
  // Filter and Search
  setFilter: (filter: Partial<AssetFilter>) => void;
  clearFilter: () => void;
  
  // UI State
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Bulk Actions
  performBulkAction: (action: AssetBulkAction) => void;
  
  // Optimistic Updates
  optimisticUpdateAsset: (id: string, updates: Partial<Asset>) => void;
  optimisticAddAsset: (asset: Asset) => void;
  optimisticRemoveAsset: (id: string) => void;
}

const defaultFilter: AssetFilter = {
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export const useAssetStore = create<AssetStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      assets: [],
      selectedAssets: [],
      currentAsset: null,
      folders: [],
      currentFolder: null,
      uploads: [],
      filter: defaultFilter,
      isLoading: false,
      isUploading: false,
      viewMode: 'grid',

      // Asset actions
      setAssets: (assets) => set({ assets }),
      
      addAsset: (asset) => set((state) => ({
        assets: [asset, ...state.assets],
      })),
      
      updateAsset: (id, updates) => set((state) => ({
        assets: state.assets.map(asset =>
          asset.id === id ? { ...asset, ...updates } : asset
        ),
        currentAsset: state.currentAsset?.id === id 
          ? { ...state.currentAsset, ...updates }
          : state.currentAsset,
      })),
      
      removeAsset: (id) => set((state) => ({
        assets: state.assets.filter(asset => asset.id !== id),
        selectedAssets: state.selectedAssets.filter(assetId => assetId !== id),
        currentAsset: state.currentAsset?.id === id ? null : state.currentAsset,
      })),
      
      setCurrentAsset: (asset) => set({ currentAsset: asset }),

      // Selection actions
      selectAsset: (id) => set((state) => ({
        selectedAssets: state.selectedAssets.includes(id) 
          ? state.selectedAssets 
          : [...state.selectedAssets, id],
      })),
      
      deselectAsset: (id) => set((state) => ({
        selectedAssets: state.selectedAssets.filter(assetId => assetId !== id),
      })),
      
      selectAllAssets: () => set((state) => ({
        selectedAssets: state.assets.map(asset => asset.id),
      })),
      
      clearSelection: () => set({ selectedAssets: [] }),
      
      toggleAssetSelection: (id) => {
        const { selectedAssets } = get();
        if (selectedAssets.includes(id)) {
          get().deselectAsset(id);
        } else {
          get().selectAsset(id);
        }
      },

      // Folder actions
      setFolders: (folders) => set({ folders }),
      
      setCurrentFolder: (folder) => set({ currentFolder: folder }),
      
      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, folder],
      })),
      
      updateFolder: (id, updates) => set((state) => ({
        folders: state.folders.map(folder =>
          folder.id === id ? { ...folder, ...updates } : folder
        ),
        currentFolder: state.currentFolder?.id === id 
          ? { ...state.currentFolder, ...updates }
          : state.currentFolder,
      })),

      // Upload actions
      addUpload: (upload) => set((state) => ({
        uploads: [...state.uploads, upload],
      })),
      
      updateUpload: (index, updates) => set((state) => ({
        uploads: state.uploads.map((upload, i) =>
          i === index ? { ...upload, ...updates } : upload
        ),
      })),
      
      removeUpload: (index) => set((state) => ({
        uploads: state.uploads.filter((_, i) => i !== index),
      })),
      
      clearUploads: () => set({ uploads: [] }),

      // Filter actions
      setFilter: (newFilter) => set((state) => ({
        filter: { ...state.filter, ...newFilter },
      })),
      
      clearFilter: () => set({ filter: defaultFilter }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setUploading: (uploading) => set({ isUploading: uploading }),
      setViewMode: (mode) => set({ viewMode: mode }),

      // Bulk actions
      performBulkAction: (action) => {
        const { selectedAssets, assets } = get();
        
        switch (action.action) {
          case 'delete':
            set((state) => ({
              assets: state.assets.filter(asset => !selectedAssets.includes(asset.id)),
              selectedAssets: [],
            }));
            break;
          case 'approve':
            set((state) => ({
              assets: state.assets.map(asset =>
                selectedAssets.includes(asset.id)
                  ? { ...asset, status: 'approved' as const }
                  : asset
              ),
            }));
            break;
          case 'reject':
            set((state) => ({
              assets: state.assets.map(asset =>
                selectedAssets.includes(asset.id)
                  ? { ...asset, status: 'rejected' as const }
                  : asset
              ),
            }));
            break;
          case 'archive':
            set((state) => ({
              assets: state.assets.map(asset =>
                selectedAssets.includes(asset.id)
                  ? { ...asset, status: 'archived' as const }
                  : asset
              ),
            }));
            break;
          case 'move':
            if (action.metadata?.folderId) {
              set((state) => ({
                assets: state.assets.map(asset =>
                  selectedAssets.includes(asset.id)
                    ? { ...asset, folderId: action.metadata!.folderId }
                    : asset
                ),
              }));
            }
            break;
          case 'tag':
            if (action.metadata?.tags) {
              set((state) => ({
                assets: state.assets.map(asset =>
                  selectedAssets.includes(asset.id)
                    ? { 
                        ...asset, 
                        tags: [...new Set([...asset.tags, ...action.metadata!.tags])]
                      }
                    : asset
                ),
              }));
            }
            break;
        }
        
        // Clear selection after bulk action
        set({ selectedAssets: [] });
      },

      // Optimistic updates
      optimisticUpdateAsset: (id, updates) => {
        get().updateAsset(id, updates);
      },
      
      optimisticAddAsset: (asset) => {
        get().addAsset(asset);
      },
      
      optimisticRemoveAsset: (id) => {
        get().removeAsset(id);
      },
    }),
    {
      name: 'asset-store',
    }
  )
); 