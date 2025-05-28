import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { graphqlClient } from '@/lib/graphql-client';
import {
  USER_NOTIFICATIONS,
  SYSTEM_NOTIFICATIONS,
  CAMPAIGN_STATUS_UPDATED,
  AI_RECOMMENDATION_GENERATED,
  ASSET_APPROVAL_STATUS_CHANGED,
  PLATFORM_CONNECTION_STATUS,
} from '@/lib/graphql/notifications';

export const useNotificationSubscriptions = () => {
  const { addNotification } = useNotificationStore();
  const { user, isAuthenticated } = useAuthStore();
  const subscriptionsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from notification:', error);
      }
    });
    subscriptionsRef.current = [];

    // Only initialize subscriptions if WebSocket is connected or in development mode
    if (!graphqlClient.isWebSocketConnected() && !import.meta.env.DEV) {
      console.log('WebSocket not connected, skipping notification subscriptions');
      return;
    }

    try {
      // User-specific notifications subscription
      const userNotificationsUnsubscribe = graphqlClient.subscribe(
        USER_NOTIFICATIONS.loc?.source.body || '',
        {}
      );

      // System notifications subscription
      const systemNotificationsUnsubscribe = graphqlClient.subscribe(
        SYSTEM_NOTIFICATIONS.loc?.source.body || '',
        {}
      );

      // AI recommendations subscription
      const aiRecommendationsUnsubscribe = graphqlClient.subscribe(
        AI_RECOMMENDATION_GENERATED.loc?.source.body || '',
        { userId: user.id }
      );

      // Platform connection status subscription
      const platformStatusUnsubscribe = graphqlClient.subscribe(
        PLATFORM_CONNECTION_STATUS.loc?.source.body || '',
        { userId: user.id }
      );

      // Store unsubscribe functions
      subscriptionsRef.current = [
        userNotificationsUnsubscribe,
        systemNotificationsUnsubscribe,
        aiRecommendationsUnsubscribe,
        platformStatusUnsubscribe,
      ].filter(Boolean); // Filter out any undefined subscriptions

      console.log('Notification subscriptions initialized for user:', user.id);
    } catch (error) {
      console.error('Failed to initialize notification subscriptions:', error);
    }

    // Mock subscription handlers for demo purposes
    // In a real implementation, these would be handled by the GraphQL client
    const mockSubscriptionHandlers = () => {
      // Simulate receiving notifications from GraphQL subscriptions
      const handleUserNotification = (data: any) => {
        if (data?.userNotifications?.data) {
          const notificationData = data.userNotifications.data;
          
          // Convert GraphQL notification to store format
          if (notificationData.__typename === 'Notification') {
            addNotification({
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              priority: notificationData.priority,
              read: false,
              actionUrl: notificationData.actionUrl,
              actionLabel: notificationData.actionLabel,
              metadata: notificationData.metadata,
              expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
            });
          }
          
          // Handle campaign alerts
          else if (notificationData.__typename === 'CampaignAlert') {
            addNotification({
              type: 'campaign',
              title: `Campaign Alert: ${notificationData.campaignName}`,
              message: notificationData.message,
              priority: notificationData.severity === 'critical' ? 'urgent' : 'high',
              read: false,
              actionUrl: `/campaigns/${notificationData.campaignId}/analytics`,
              actionLabel: 'View Campaign',
              metadata: {
                campaignId: notificationData.campaignId,
                alertType: notificationData.alertType,
                threshold: notificationData.threshold,
                currentValue: notificationData.currentValue,
              },
            });
          }
          
          // Handle AI recommendations
          else if (notificationData.__typename === 'AIRecommendation') {
            addNotification({
              type: 'ai_recommendation',
              title: notificationData.title,
              message: notificationData.description,
              priority: notificationData.impact === 'high' ? 'high' : 'medium',
              read: false,
              actionUrl: notificationData.actions?.[0]?.url,
              actionLabel: notificationData.actions?.[0]?.label || 'View Details',
              metadata: {
                recommendationId: notificationData.id,
                category: notificationData.category,
                confidence: notificationData.confidence,
                impact: notificationData.impact,
              },
              expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
            });
          }
          
          // Handle asset approval updates
          else if (notificationData.__typename === 'AssetApprovalUpdate') {
            const statusMessages = {
              approved: 'has been approved',
              rejected: 'has been rejected',
              revision_required: 'requires revisions',
            };
            
            addNotification({
              type: 'asset_approval',
              title: 'Asset Status Update',
              message: `Your asset "${notificationData.assetName}" ${statusMessages[notificationData.status as keyof typeof statusMessages] || 'status has changed'}.`,
              priority: notificationData.status === 'rejected' ? 'high' : 'medium',
              read: false,
              actionUrl: `/assets/${notificationData.assetId}`,
              actionLabel: 'View Asset',
              metadata: {
                assetId: notificationData.assetId,
                status: notificationData.status,
                reviewerName: notificationData.reviewerName,
                comments: notificationData.comments,
              },
            });
          }
          
          // Handle chat mentions
          else if (notificationData.__typename === 'ChatMention') {
            addNotification({
              type: 'chat_mention',
              title: 'You were mentioned',
              message: `${notificationData.mentionedBy.name} mentioned you in "${notificationData.boardName}".`,
              priority: 'medium',
              read: false,
              actionUrl: `/board/${notificationData.boardId}`,
              actionLabel: 'View Discussion',
              metadata: {
                boardId: notificationData.boardId,
                messageId: notificationData.messageId,
                mentionedBy: notificationData.mentionedBy,
                content: notificationData.content,
              },
            });
          }
        }
      };

      const handleSystemNotification = (data: any) => {
        if (data?.systemNotifications) {
          const notification = data.systemNotifications;
          
          addNotification({
            type: 'system',
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            read: false,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
            metadata: {
              targetAudience: notification.targetAudience,
              startTime: notification.startTime,
              endTime: notification.endTime,
            },
            expiresAt: notification.endTime ? new Date(notification.endTime) : undefined,
          });
        }
      };

      const handlePlatformStatus = (data: any) => {
        if (data?.platformConnectionStatus) {
          const platform = data.platformConnectionStatus;
          
          if (platform.status === 'expired') {
            addNotification({
              type: 'system',
              title: 'Platform Connection Expired',
              message: `Your ${platform.platformType.replace('_', ' ')} connection has expired. Please re-authenticate to continue syncing data.`,
              priority: 'high',
              read: false,
              actionUrl: '/settings?tab=platforms',
              actionLabel: 'Reconnect',
              metadata: {
                platformId: platform.platformId,
                platformType: platform.platformType,
                expiresAt: platform.expiresAt,
              },
            });
          } else if (platform.status === 'error') {
            addNotification({
              type: 'system',
              title: 'Platform Connection Error',
              message: `There was an error with your ${platform.platformType.replace('_', ' ')} connection. Please check your settings.`,
              priority: 'high',
              read: false,
              actionUrl: '/settings?tab=platforms',
              actionLabel: 'View Settings',
              metadata: {
                platformId: platform.platformId,
                platformType: platform.platformType,
                error: platform.error,
              },
            });
          }
        }
      };

      // Mock subscription events for demo
      console.log('Notification subscriptions initialized for user:', user.id);
      
      // Simulate periodic notifications for demo
      const demoInterval = setInterval(() => {
        if (Math.random() < 0.05) { // 5% chance every 30 seconds
          const mockNotifications = [
            {
              userNotifications: {
                data: {
                  __typename: 'CampaignAlert',
                  campaignId: 'camp_123',
                  campaignName: 'Summer Sale 2024',
                  alertType: 'budget_exceeded',
                  severity: 'high',
                  message: 'Campaign has exceeded 90% of daily budget',
                  threshold: 1000,
                  currentValue: 950,
                  createdAt: new Date().toISOString(),
                }
              }
            },
            {
              userNotifications: {
                data: {
                  __typename: 'AIRecommendation',
                  id: 'rec_456',
                  type: 'budget_optimization',
                  title: 'Increase Video Ad Budget',
                  description: 'Based on performance data, increasing video ad budget by 20% could improve ROAS by 15%.',
                  confidence: 0.85,
                  impact: 'high',
                  category: 'optimization',
                  actions: [{
                    type: 'navigate',
                    label: 'Apply Recommendation',
                    url: '/campaigns/123/edit'
                  }],
                  createdAt: new Date().toISOString(),
                }
              }
            }
          ];
          
          const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
          handleUserNotification(randomNotification);
        }
      }, 30000);

      return () => {
        clearInterval(demoInterval);
      };
    };

    const cleanupDemo = mockSubscriptionHandlers();

    // Cleanup function
    return () => {
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
      cleanupDemo();
    };
  }, [isAuthenticated, user, addNotification]);

  // Subscribe to specific campaign updates
  const subscribeToCampaign = (campaignId: string) => {
    if (!isAuthenticated) return () => {};

    const unsubscribe = graphqlClient.subscribe(
      CAMPAIGN_STATUS_UPDATED.loc?.source.body || '',
      { campaignId }
    );

    return unsubscribe;
  };

  // Subscribe to specific asset approval updates
  const subscribeToAsset = (assetId: string) => {
    if (!isAuthenticated) return () => {};

    const unsubscribe = graphqlClient.subscribe(
      ASSET_APPROVAL_STATUS_CHANGED.loc?.source.body || '',
      { assetId }
    );

    return unsubscribe;
  };

  return {
    subscribeToCampaign,
    subscribeToAsset,
  };
}; 