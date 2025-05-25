export interface Asset {
  id: string;
  name: string;
  description?: string;
  type: AssetType;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  status: AssetStatus;
  tags: string[];
  metadata: AssetMetadata;
  versions: AssetVersion[];
  approvals: AssetApproval[];
  aiSuggestions: AISuggestion[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folderId?: string;
}

export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'other';

export type AssetStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio in seconds
  format?: string;
  colorProfile?: string;
  resolution?: string;
  fileHash: string;
  exifData?: Record<string, any>;
}

export interface AssetVersion {
  id: string;
  version: number;
  url: string;
  size: number;
  changes: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface AssetApproval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId: string;
  reviewerName: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISuggestion {
  id: string;
  type: 'tag' | 'optimization' | 'usage' | 'compliance';
  title: string;
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
  metadata?: Record<string, any>;
}

export interface AssetFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  assetId?: string;
}

export interface AssetFilter {
  type?: AssetType[];
  status?: AssetStatus[];
  tags?: string[];
  folderId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface AssetBulkAction {
  action: 'delete' | 'approve' | 'reject' | 'archive' | 'move' | 'tag';
  assetIds: string[];
  metadata?: Record<string, any>;
}

export interface AssetUsage {
  id: string;
  assetId: string;
  campaignId?: string;
  campaignName?: string;
  context: string;
  usedAt: string;
} 