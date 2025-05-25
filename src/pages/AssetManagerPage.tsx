import React, { useEffect } from 'react';
import { AssetManager } from '@/components/assets/AssetManager';
import { useAssetStore } from '@/store/assetStore';
import { Asset } from '@/types/asset';

export const AssetManagerPage: React.FC = () => {
  const { setAssets } = useAssetStore();

  // Load demo assets on mount
  useEffect(() => {
    const demoAssets: Asset[] = [
      {
        id: 'asset-1',
        name: 'Product Hero Image.jpg',
        description: 'Main hero image for product landing page',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 2048576,
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
        status: 'approved',
        tags: ['product', 'hero', 'landing-page'],
        metadata: {
          width: 1920,
          height: 1080,
          format: 'jpeg',
          fileHash: 'hash-1',
        },
        versions: [],
        approvals: [{
          id: 'approval-1',
          status: 'approved',
          reviewerId: 'user-1',
          reviewerName: 'John Doe',
          comments: 'Looks great, approved for use',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        }],
        aiSuggestions: [{
          id: 'suggestion-1',
          type: 'optimization',
          title: 'Optimize Image Size',
          description: 'This image can be compressed by 25% without quality loss',
          confidence: 0.89,
          actionable: true,
        }],
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-1',
        folderId: 'images',
      },
      {
        id: 'asset-2',
        name: 'Campaign Video.mp4',
        description: 'Main campaign video for Q1 launch',
        type: 'video',
        mimeType: 'video/mp4',
        size: 15728640,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=200',
        status: 'pending_review',
        tags: ['campaign', 'video', 'q1-launch'],
        metadata: {
          width: 1280,
          height: 720,
          duration: 30,
          format: 'mp4',
          fileHash: 'hash-2',
        },
        versions: [],
        approvals: [],
        aiSuggestions: [{
          id: 'suggestion-2',
          type: 'usage',
          title: 'Add Captions',
          description: 'Consider adding captions for better accessibility',
          confidence: 0.95,
          actionable: true,
        }],
        createdAt: '2024-01-16T14:00:00Z',
        updatedAt: '2024-01-16T14:00:00Z',
        createdBy: 'user-2',
        folderId: 'videos',
      },
      {
        id: 'asset-3',
        name: 'Brand Guidelines.pdf',
        description: 'Official brand guidelines document',
        type: 'document',
        mimeType: 'application/pdf',
        size: 5242880,
        url: '#',
        status: 'approved',
        tags: ['brand', 'guidelines', 'official'],
        metadata: {
          format: 'pdf',
          fileHash: 'hash-3',
        },
        versions: [],
        approvals: [{
          id: 'approval-3',
          status: 'approved',
          reviewerId: 'user-1',
          reviewerName: 'John Doe',
          comments: 'Brand guidelines approved',
          createdAt: '2024-01-10T16:00:00Z',
          updatedAt: '2024-01-10T16:00:00Z',
        }],
        aiSuggestions: [],
        createdAt: '2024-01-10T15:00:00Z',
        updatedAt: '2024-01-10T16:00:00Z',
        createdBy: 'user-1',
        folderId: 'brand',
      },
      {
        id: 'asset-4',
        name: 'Social Media Banner.png',
        description: 'Banner for social media campaigns',
        type: 'image',
        mimeType: 'image/png',
        size: 1048576,
        url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200',
        status: 'rejected',
        tags: ['social-media', 'banner', 'campaign'],
        metadata: {
          width: 1200,
          height: 630,
          format: 'png',
          fileHash: 'hash-4',
        },
        versions: [],
        approvals: [{
          id: 'approval-4',
          status: 'rejected',
          reviewerId: 'user-2',
          reviewerName: 'Jane Smith',
          comments: 'Colors don\'t match brand guidelines. Please revise.',
          createdAt: '2024-01-17T11:00:00Z',
          updatedAt: '2024-01-17T11:00:00Z',
        }],
        aiSuggestions: [{
          id: 'suggestion-4',
          type: 'compliance',
          title: 'Brand Color Mismatch',
          description: 'The colors used don\'t match the brand palette',
          confidence: 0.92,
          actionable: true,
        }],
        createdAt: '2024-01-17T09:00:00Z',
        updatedAt: '2024-01-17T11:00:00Z',
        createdBy: 'user-2',
        folderId: 'campaigns',
      },
    ];

    setAssets(demoAssets);
  }, [setAssets]);

  return <AssetManager />;
}; 