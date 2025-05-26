import { gql } from 'graphql-tag';

// Notification Types
export const NOTIFICATION_FRAGMENT = gql`
  fragment NotificationFragment on Notification {
    id
    type
    title
    message
    priority
    read
    actionUrl
    actionLabel
    metadata
    createdAt
    expiresAt
  }
`;

// Queries
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int = 50, $offset: Int = 0, $unreadOnly: Boolean = false) {
    notifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
      ...NotificationFragment
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const GET_NOTIFICATION_PREFERENCES = gql`
  query GetNotificationPreferences {
    notificationPreferences {
      email {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
      push {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
      inApp {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount {
    unreadNotificationCount
  }
`;

// Mutations
export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      ...NotificationFragment
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      success
      count
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      success
    }
  }
`;

export const CLEAR_ALL_NOTIFICATIONS = gql`
  mutation ClearAllNotifications {
    clearAllNotifications {
      success
      count
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences($preferences: NotificationPreferencesInput!) {
    updateNotificationPreferences(preferences: $preferences) {
      email {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
      push {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
      inApp {
        system
        campaign
        aiRecommendations
        assetApprovals
        chatMentions
      }
    }
  }
`;

// Subscriptions
export const NOTIFICATION_CREATED = gql`
  subscription NotificationCreated {
    notificationCreated {
      ...NotificationFragment
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const NOTIFICATION_UPDATED = gql`
  subscription NotificationUpdated($notificationId: ID!) {
    notificationUpdated(notificationId: $notificationId) {
      ...NotificationFragment
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const CAMPAIGN_STATUS_UPDATED = gql`
  subscription CampaignStatusUpdated($campaignId: ID!) {
    campaignStatusUpdated(campaignId: $campaignId) {
      id
      status
      budget {
        amount
        currency
        spent
        remaining
      }
      performance {
        impressions
        clicks
        conversions
        ctr
        cpc
        roas
      }
      alerts {
        type
        severity
        message
        threshold
        currentValue
      }
      updatedAt
    }
  }
`;

export const AI_RECOMMENDATION_GENERATED = gql`
  subscription AIRecommendationGenerated($userId: ID!) {
    aiRecommendationGenerated(userId: $userId) {
      id
      type
      title
      description
      confidence
      impact
      effort
      category
      data
      actions {
        type
        label
        url
        parameters
      }
      createdAt
      expiresAt
    }
  }
`;

export const ASSET_APPROVAL_STATUS_CHANGED = gql`
  subscription AssetApprovalStatusChanged($assetId: ID!) {
    assetApprovalStatusChanged(assetId: $assetId) {
      id
      status
      approvals {
        id
        status
        reviewerId
        reviewer {
          id
          name
          email
        }
        comments
        createdAt
        updatedAt
      }
      updatedAt
    }
  }
`;

// Real-time notification subscription for the current user
export const USER_NOTIFICATIONS = gql`
  subscription UserNotifications {
    userNotifications {
      type
      data {
        ... on Notification {
          ...NotificationFragment
        }
        ... on CampaignAlert {
          campaignId
          campaignName
          alertType
          severity
          message
          threshold
          currentValue
          createdAt
        }
        ... on AIRecommendation {
          id
          type
          title
          description
          confidence
          impact
          category
          actions {
            type
            label
            url
          }
          createdAt
        }
        ... on AssetApprovalUpdate {
          assetId
          assetName
          status
          reviewerName
          comments
          updatedAt
        }
        ... on ChatMention {
          boardId
          boardName
          messageId
          mentionedBy {
            id
            name
            email
          }
          content
          createdAt
        }
      }
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

// System-wide notifications (maintenance, announcements, etc.)
export const SYSTEM_NOTIFICATIONS = gql`
  subscription SystemNotifications {
    systemNotifications {
      id
      type
      title
      message
      priority
      targetAudience
      startTime
      endTime
      actionUrl
      actionLabel
      createdAt
    }
  }
`;

// Platform connection status updates
export const PLATFORM_CONNECTION_STATUS = gql`
  subscription PlatformConnectionStatus($userId: ID!) {
    platformConnectionStatus(userId: $userId) {
      platformId
      platformType
      status
      lastSyncAt
      expiresAt
      error
      metrics {
        totalSpend
        activeCampaigns
        lastActivity
      }
      updatedAt
    }
  }
`; 