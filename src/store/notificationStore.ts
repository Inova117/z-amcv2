import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'system' | 'campaign' | 'ai_recommendation' | 'asset_approval' | 'chat_mention';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  email: {
    system: boolean;
    campaign: boolean;
    ai_recommendations: boolean;
    asset_approvals: boolean;
    chat_mentions: boolean;
  };
  push: {
    system: boolean;
    campaign: boolean;
    ai_recommendations: boolean;
    asset_approvals: boolean;
    chat_mentions: boolean;
  };
  inApp: {
    system: boolean;
    campaign: boolean;
    ai_recommendations: boolean;
    asset_approvals: boolean;
    chat_mentions: boolean;
  };
}

interface NotificationStore {
  notifications: Notification[];
  preferences: NotificationPreferences;
  isLoading: boolean;
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  
  // Subscription management
  subscribeToNotifications: () => () => void;
  
  // Initialization
  initialize: () => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  email: {
    system: true,
    campaign: true,
    ai_recommendations: false,
    asset_approvals: true,
    chat_mentions: true,
  },
  push: {
    system: true,
    campaign: false,
    ai_recommendations: false,
    asset_approvals: true,
    chat_mentions: true,
  },
  inApp: {
    system: true,
    campaign: true,
    ai_recommendations: true,
    asset_approvals: true,
    chat_mentions: true,
  },
};

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'ai_recommendation',
    title: 'New AI Strategy Recommendation',
    message: 'Based on your recent campaign performance, we recommend increasing your video ad budget by 15%.',
    priority: 'medium',
    read: false,
    actionUrl: '/campaigns/123/edit',
    actionLabel: 'View Campaign',
    metadata: { campaignId: '123', recommendationType: 'budget_optimization' },
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '2',
    type: 'campaign',
    title: 'Campaign Performance Alert',
    message: 'Your "Summer Sale 2024" campaign has exceeded its daily budget limit.',
    priority: 'high',
    read: false,
    actionUrl: '/campaigns/456/analytics',
    actionLabel: 'View Analytics',
    metadata: { campaignId: '456', alertType: 'budget_exceeded' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    type: 'asset_approval',
    title: 'Asset Approved',
    message: 'Your video asset "Product Demo V2" has been approved and is ready for use.',
    priority: 'low',
    read: true,
    actionUrl: '/assets/789',
    actionLabel: 'View Asset',
    metadata: { assetId: '789', approvedBy: 'john.doe@company.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance will occur on Sunday, Dec 15th from 2:00 AM - 4:00 AM EST.',
    priority: 'medium',
    read: false,
    metadata: { maintenanceWindow: '2024-12-15T02:00:00Z' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    expiresAt: new Date('2024-12-15T04:00:00Z'),
  },
  {
    id: '5',
    type: 'chat_mention',
    title: 'You were mentioned in a chat',
    message: '@you Sarah mentioned you in the "Q4 Campaign Review" board discussion.',
    priority: 'medium',
    read: false,
    actionUrl: '/board/abc123',
    actionLabel: 'View Discussion',
    metadata: { boardId: 'abc123', mentionedBy: 'sarah.wilson@company.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
  },
];

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      notifications: mockNotifications,
      preferences: defaultPreferences,
      isLoading: false,
      unreadCount: mockNotifications.filter(n => !n.read).length,

      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-remove expired notifications
        if (notification.expiresAt) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, notification.expiresAt.getTime() - Date.now());
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
            email: { ...state.preferences.email, ...newPreferences.email },
            push: { ...state.preferences.push, ...newPreferences.push },
            inApp: { ...state.preferences.inApp, ...newPreferences.inApp },
          },
        }));

        // In a real app, this would sync with the backend
        console.log('Notification preferences updated:', newPreferences);
      },

      subscribeToNotifications: () => {
        // In a real implementation, this would set up GraphQL subscriptions
        // subscription NotificationUpdates {
        //   notificationCreated {
        //     id
        //     type
        //     title
        //     message
        //     priority
        //     actionUrl
        //     actionLabel
        //     metadata
        //     createdAt
        //     expiresAt
        //   }
        // }

        console.log('Subscribed to notification updates');

        // Mock real-time notifications
        const interval = setInterval(() => {
          const mockTypes = ['ai_recommendation', 'campaign', 'system'] as const;
          const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
          
          if (Math.random() < 0.1) { // 10% chance every 30 seconds
            get().addNotification({
              type: randomType,
              title: `New ${randomType.replace('_', ' ')} notification`,
              message: `This is a simulated real-time notification of type ${randomType}.`,
              priority: 'medium',
              read: false,
              metadata: { simulated: true },
            });
          }
        }, 30000); // Check every 30 seconds

        return () => {
          clearInterval(interval);
          console.log('Unsubscribed from notification updates');
        };
      },

      initialize: async () => {
        set({ isLoading: true });
        
        // Simulate loading preferences and recent notifications
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clean up expired notifications
        const now = new Date();
        set((state) => ({
          notifications: state.notifications.filter(n => 
            !n.expiresAt || n.expiresAt > now
          ),
          isLoading: false,
        }));

        // Start subscription
        get().subscribeToNotifications();
      },
    }),
    {
      name: 'notification-store',
    }
  )
); 