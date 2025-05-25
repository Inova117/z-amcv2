import { gql } from '@apollo/client';

export const GET_ASSETS = gql`
  query GetAssets($filter: AssetFilterInput, $pagination: PaginationInput) {
    assets(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        description
        type
        mimeType
        size
        url
        thumbnailUrl
        status
        tags
        metadata {
          width
          height
          duration
          format
          colorProfile
          resolution
          fileHash
        }
        createdAt
        updatedAt
        createdBy
        folderId
      }
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const GET_ASSET = gql`
  query GetAsset($id: ID!) {
    asset(id: $id) {
      id
      name
      description
      type
      mimeType
      size
      url
      thumbnailUrl
      status
      tags
      metadata {
        width
        height
        duration
        format
        colorProfile
        resolution
        fileHash
        exifData
      }
      versions {
        id
        version
        url
        size
        changes
        createdAt
        createdBy
        isActive
      }
      approvals {
        id
        status
        reviewerId
        reviewerName
        comments
        createdAt
        updatedAt
      }
      aiSuggestions {
        id
        type
        title
        description
        confidence
        actionable
        metadata
      }
      createdAt
      updatedAt
      createdBy
      folderId
    }
  }
`;

export const UPLOAD_ASSET = gql`
  mutation UploadAsset($input: AssetUploadInput!) {
    uploadAsset(input: $input) {
      id
      name
      type
      url
      thumbnailUrl
      status
      uploadUrl
      uploadFields
    }
  }
`;

export const CREATE_ASSET = gql`
  mutation CreateAsset($input: AssetCreateInput!) {
    createAsset(input: $input) {
      id
      name
      description
      type
      mimeType
      size
      url
      thumbnailUrl
      status
      tags
      metadata {
        width
        height
        duration
        format
        fileHash
      }
      createdAt
      updatedAt
      createdBy
      folderId
    }
  }
`;

export const UPDATE_ASSET = gql`
  mutation UpdateAsset($id: ID!, $input: AssetUpdateInput!) {
    updateAsset(id: $id, input: $input) {
      id
      name
      description
      tags
      status
      folderId
      updatedAt
    }
  }
`;

export const DELETE_ASSET = gql`
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id) {
      success
      message
    }
  }
`;

export const APPROVE_ASSET = gql`
  mutation ApproveAsset($id: ID!, $input: AssetApprovalInput!) {
    approveAsset(id: $id, input: $input) {
      id
      status
      approvals {
        id
        status
        reviewerId
        reviewerName
        comments
        createdAt
        updatedAt
      }
    }
  }
`;

export const REJECT_ASSET = gql`
  mutation RejectAsset($id: ID!, $input: AssetRejectionInput!) {
    rejectAsset(id: $id, input: $input) {
      id
      status
      approvals {
        id
        status
        reviewerId
        reviewerName
        comments
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_ASSET_VERSION = gql`
  mutation CreateAssetVersion($assetId: ID!, $input: AssetVersionInput!) {
    createAssetVersion(assetId: $assetId, input: $input) {
      id
      version
      url
      size
      changes
      createdAt
      createdBy
      isActive
    }
  }
`;

export const GET_ASSET_USAGE = gql`
  query GetAssetUsage($assetId: ID!) {
    assetUsage(assetId: $assetId) {
      id
      assetId
      campaignId
      campaignName
      context
      usedAt
    }
  }
`;

export const BULK_UPDATE_ASSETS = gql`
  mutation BulkUpdateAssets($input: AssetBulkActionInput!) {
    bulkUpdateAssets(input: $input) {
      success
      updatedCount
      errors {
        assetId
        message
      }
    }
  }
`;

export const GET_FOLDERS = gql`
  query GetFolders($parentId: ID) {
    folders(parentId: $parentId) {
      id
      name
      description
      parentId
      path
      assetCount
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_FOLDER = gql`
  mutation CreateFolder($input: FolderCreateInput!) {
    createFolder(input: $input) {
      id
      name
      description
      parentId
      path
      assetCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_AI_SUGGESTIONS = gql`
  query GetAISuggestions($assetId: ID!) {
    aiSuggestions(assetId: $assetId) {
      id
      type
      title
      description
      confidence
      actionable
      metadata
    }
  }
`;

export const APPLY_AI_SUGGESTION = gql`
  mutation ApplyAISuggestion($suggestionId: ID!, $assetId: ID!) {
    applyAISuggestion(suggestionId: $suggestionId, assetId: $assetId) {
      success
      message
      updatedAsset {
        id
        tags
        metadata {
          width
          height
          format
        }
      }
    }
  }
`;

// Subscription for real-time asset updates
export const ASSET_UPDATED = gql`
  subscription AssetUpdated($assetId: ID!) {
    assetUpdated(assetId: $assetId) {
      id
      status
      approvals {
        id
        status
        reviewerId
        comments
        updatedAt
      }
      updatedAt
    }
  }
`;

// Subscription for upload progress
export const UPLOAD_PROGRESS = gql`
  subscription UploadProgress($uploadId: ID!) {
    uploadProgress(uploadId: $uploadId) {
      uploadId
      progress
      status
      error
    }
  }
`; 