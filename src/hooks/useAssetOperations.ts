import { useAssetStore } from '@/store/assetStore';
import { useAuthStore } from '@/store/authStore';
import { Asset, AssetFilter, AssetUpload, AssetFolder, AssetBulkAction } from '@/types/asset';
import { useToast } from '@/hooks/use-toast';

export const useAssetOperations = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    optimisticAddAsset,
    optimisticUpdateAsset,
    optimisticRemoveAsset,
    setLoading,
    setUploading,
    addUpload,
    updateUpload,
    removeUpload,
    performBulkAction,
  } = useAssetStore();

  // Simulated file upload with progress
  const uploadAsset = async (file: File, folderId?: string): Promise<Asset> => {
    setUploading(true);
    
    const upload: AssetUpload = {
      file,
      progress: 0,
      status: 'pending',
    };
    
    addUpload(upload);
    const uploadIndex = 0; // In real implementation, track by ID
    
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateUpload(uploadIndex, { progress, status: 'uploading' });
      }
      
      // Simulate processing
      updateUpload(uploadIndex, { status: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create asset
      const asset: Asset = {
        id: `asset-${Date.now()}`,
        name: file.name,
        description: '',
        type: getAssetType(file.type),
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: 'draft',
        tags: [],
        metadata: {
          fileHash: `hash-${Date.now()}`,
          width: file.type.startsWith('image/') ? 1920 : undefined,
          height: file.type.startsWith('image/') ? 1080 : undefined,
          format: file.type.split('/')[1],
        },
        versions: [],
        approvals: [],
        aiSuggestions: generateAISuggestions(file),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'demo-user',
        folderId,
      };
      
      optimisticAddAsset(asset);
      updateUpload(uploadIndex, { status: 'completed', assetId: asset.id });
      
      toast({
        title: "Asset Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      // Remove upload after delay
      setTimeout(() => removeUpload(uploadIndex), 2000);
      
      return asset;
    } catch (error) {
      updateUpload(uploadIndex, { status: 'error', error: 'Upload failed' });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedAsset = { ...updates, updatedAt: new Date().toISOString() };
      optimisticUpdateAsset(id, updatedAsset);
      
      toast({
        title: "Asset Updated",
        description: "Asset has been updated successfully.",
      });
      
      return updatedAsset as Asset;
    } catch (error) {
      throw error;
    }
  };

  const deleteAsset = async (id: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      optimisticRemoveAsset(id);
      
      toast({
        title: "Asset Deleted",
        description: "Asset has been deleted successfully.",
      });
    } catch (error) {
      throw error;
    }
  };

  const approveAsset = async (id: string, comments?: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const approval = {
        id: `approval-${Date.now()}`,
        status: 'approved' as const,
        reviewerId: user?.id || 'demo-user',
        reviewerName: user?.name || 'Demo User',
        comments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      optimisticUpdateAsset(id, {
        status: 'approved',
        approvals: [approval],
      });
      
      toast({
        title: "Asset Approved",
        description: "Asset has been approved successfully.",
      });
    } catch (error) {
      throw error;
    }
  };

  const rejectAsset = async (id: string, comments: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const approval = {
        id: `approval-${Date.now()}`,
        status: 'rejected' as const,
        reviewerId: user?.id || 'demo-user',
        reviewerName: user?.name || 'Demo User',
        comments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      optimisticUpdateAsset(id, {
        status: 'rejected',
        approvals: [approval],
      });
      
      toast({
        title: "Asset Rejected",
        description: "Asset has been rejected.",
        variant: "destructive",
      });
    } catch (error) {
      throw error;
    }
  };

  const createAssetVersion = async (assetId: string, file: File, changes: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const version = {
        id: `version-${Date.now()}`,
        version: Date.now(), // In real app, increment version number
        url: URL.createObjectURL(file),
        size: file.size,
        changes,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || 'demo-user',
        isActive: true,
      };
      
      // Update asset with new version
      optimisticUpdateAsset(assetId, {
        versions: [version],
        url: version.url,
        size: version.size,
        updatedAt: new Date().toISOString(),
      });
      
      toast({
        title: "New Version Created",
        description: "Asset version has been created successfully.",
      });
    } catch (error) {
      throw error;
    }
  };

  const bulkUpdateAssets = async (action: AssetBulkAction): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      performBulkAction(action);
      
      const actionNames = {
        delete: 'deleted',
        approve: 'approved',
        reject: 'rejected',
        archive: 'archived',
        move: 'moved',
        tag: 'tagged',
      };
      
      toast({
        title: "Bulk Action Completed",
        description: `${action.assetIds.length} assets have been ${actionNames[action.action]}.`,
      });
    } catch (error) {
      throw error;
    }
  };

  const createFolder = async (name: string, parentId?: string): Promise<AssetFolder> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const folder: AssetFolder = {
        id: `folder-${Date.now()}`,
        name,
        description: '',
        parentId,
        path: parentId ? `/parent/${name}` : `/${name}`,
        assetCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      toast({
        title: "Folder Created",
        description: `Folder "${name}" has been created.`,
      });
      
      return folder;
    } catch (error) {
      throw error;
    }
  };

  const applyAISuggestion = async (suggestionId: string, assetId: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate applying AI suggestion (e.g., adding tags)
      const suggestedTags = ['ai-suggested', 'optimized', 'enhanced'];
      
      optimisticUpdateAsset(assetId, {
        tags: suggestedTags,
        updatedAt: new Date().toISOString(),
      });
      
      toast({
        title: "AI Suggestion Applied",
        description: "AI suggestion has been applied to the asset.",
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    uploadAsset,
    updateAsset,
    deleteAsset,
    approveAsset,
    rejectAsset,
    createAssetVersion,
    bulkUpdateAssets,
    createFolder,
    applyAISuggestion,
  };
};

// Helper functions
const getAssetType = (mimeType: string): Asset['type'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
  return 'other';
};

const generateAISuggestions = (file: File) => {
  const suggestions = [];
  
  if (file.type.startsWith('image/')) {
    suggestions.push({
      id: `suggestion-${Date.now()}-1`,
      type: 'optimization' as const,
      title: 'Optimize Image Size',
      description: 'This image can be compressed by 30% without quality loss',
      confidence: 0.85,
      actionable: true,
      metadata: { originalSize: file.size, optimizedSize: file.size * 0.7 },
    });
    
    suggestions.push({
      id: `suggestion-${Date.now()}-2`,
      type: 'tag' as const,
      title: 'Add Relevant Tags',
      description: 'Suggested tags: product, marketing, campaign',
      confidence: 0.92,
      actionable: true,
      metadata: { suggestedTags: ['product', 'marketing', 'campaign'] },
    });
  }
  
  if (file.type.startsWith('video/')) {
    suggestions.push({
      id: `suggestion-${Date.now()}-3`,
      type: 'usage' as const,
      title: 'Video Format Recommendation',
      description: 'Consider converting to MP4 for better compatibility',
      confidence: 0.78,
      actionable: true,
      metadata: { recommendedFormat: 'mp4' },
    });
  }
  
  return suggestions;
}; 