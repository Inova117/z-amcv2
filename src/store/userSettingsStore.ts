import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NotificationPreferences } from './notificationStore';

export interface ConnectedPlatform {
  id: string;
  name: string;
  type: 'google_ads' | 'meta_ads' | 'tiktok_ads' | 'linkedin_ads' | 'twitter_ads';
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  connectedAt: Date;
  lastSyncAt?: Date;
  expiresAt?: Date;
  accountInfo: {
    accountId: string;
    accountName: string;
    email: string;
    permissions: string[];
  };
  metrics?: {
    totalSpend: number;
    activeCampaigns: number;
    lastActivity: Date;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  title?: string;
  company?: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  allowedIpAddresses: string[];
  lastPasswordChange: Date;
  loginNotifications: boolean;
}

interface UserSettingsStore {
  profile: UserProfile;
  connectedPlatforms: ConnectedPlatform[];
  notificationPreferences: NotificationPreferences;
  securitySettings: SecuritySettings;
  isLoading: boolean;
  
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  
  // Platform connection actions
  connectPlatform: (platformType: ConnectedPlatform['type']) => Promise<void>;
  disconnectPlatform: (platformId: string) => Promise<void>;
  refreshPlatformAuth: (platformId: string) => Promise<void>;
  syncPlatformData: (platformId: string) => Promise<void>;
  
  // Notification preferences
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Security settings
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  enableTwoFactor: () => Promise<{ qrCode: string; backupCodes: string[] }>;
  disableTwoFactor: (code: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Initialization
  initialize: () => Promise<void>;
}

// Mock data for demo
const mockProfile: UserProfile = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  title: 'Marketing Manager',
  company: 'ZAMC Demo Corp',
  timezone: 'America/New_York',
  language: 'en',
  theme: 'system',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

const mockConnectedPlatforms: ConnectedPlatform[] = [
  {
    id: 'google-ads-1',
    name: 'Google Ads',
    type: 'google_ads',
    status: 'connected',
    connectedAt: new Date('2024-01-20'),
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
    accountInfo: {
      accountId: '123-456-7890',
      accountName: 'ZAMC Demo Account',
      email: 'demo@example.com',
      permissions: ['read', 'write', 'manage_campaigns'],
    },
    metrics: {
      totalSpend: 15420.50,
      activeCampaigns: 8,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  },
  {
    id: 'meta-ads-1',
    name: 'Meta Ads',
    type: 'meta_ads',
    status: 'connected',
    connectedAt: new Date('2024-02-01'),
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days from now
    accountInfo: {
      accountId: 'act_987654321',
      accountName: 'ZAMC Facebook Business',
      email: 'demo@example.com',
      permissions: ['ads_read', 'ads_management'],
    },
    metrics: {
      totalSpend: 8750.25,
      activeCampaigns: 5,
      lastActivity: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    },
  },
  {
    id: 'tiktok-ads-1',
    name: 'TikTok Ads',
    type: 'tiktok_ads',
    status: 'expired',
    connectedAt: new Date('2024-01-10'),
    lastSyncAt: new Date('2024-11-15'),
    expiresAt: new Date('2024-11-20'),
    accountInfo: {
      accountId: 'tt_123456789',
      accountName: 'ZAMC TikTok Business',
      email: 'demo@example.com',
      permissions: ['campaign_management'],
    },
    metrics: {
      totalSpend: 3200.00,
      activeCampaigns: 0,
      lastActivity: new Date('2024-11-15'),
    },
  },
];

const mockSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: 480, // 8 hours
  allowedIpAddresses: [],
  lastPasswordChange: new Date('2024-01-15'),
  loginNotifications: true,
};

const defaultNotificationPreferences: NotificationPreferences = {
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

export const useUserSettingsStore = create<UserSettingsStore>()(
  devtools(
    (set, get) => ({
      profile: mockProfile,
      connectedPlatforms: mockConnectedPlatforms,
      notificationPreferences: defaultNotificationPreferences,
      securitySettings: mockSecuritySettings,
      isLoading: false,

      updateProfile: async (updates) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
            updatedAt: new Date(),
          },
          isLoading: false,
        }));
        
        console.log('Profile updated:', updates);
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true });
        
        // Simulate file upload
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a mock URL for the uploaded avatar
        const avatarUrl = URL.createObjectURL(file);
        
        set((state) => ({
          profile: {
            ...state.profile,
            avatar: avatarUrl,
            updatedAt: new Date(),
          },
          isLoading: false,
        }));
        
        console.log('Avatar uploaded:', avatarUrl);
        return avatarUrl;
      },

      connectPlatform: async (platformType) => {
        set({ isLoading: true });
        
        // Simulate OAuth flow
        console.log(`Initiating OAuth flow for ${platformType}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newPlatform: ConnectedPlatform = {
          id: `${platformType}-${Date.now()}`,
          name: platformType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: platformType,
          status: 'connected',
          connectedAt: new Date(),
          lastSyncAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
          accountInfo: {
            accountId: `acc_${Math.random().toString(36).substr(2, 9)}`,
            accountName: `Demo ${platformType} Account`,
            email: get().profile.email,
            permissions: ['read', 'write'],
          },
          metrics: {
            totalSpend: 0,
            activeCampaigns: 0,
            lastActivity: new Date(),
          },
        };
        
        set((state) => ({
          connectedPlatforms: [...state.connectedPlatforms, newPlatform],
          isLoading: false,
        }));
        
        console.log(`${platformType} connected successfully`);
      },

      disconnectPlatform: async (platformId) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set((state) => ({
          connectedPlatforms: state.connectedPlatforms.filter(p => p.id !== platformId),
          isLoading: false,
        }));
        
        console.log(`Platform ${platformId} disconnected`);
      },

      refreshPlatformAuth: async (platformId) => {
        set({ isLoading: true });
        
        // Simulate re-authentication
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        set((state) => ({
          connectedPlatforms: state.connectedPlatforms.map(p =>
            p.id === platformId
              ? {
                  ...p,
                  status: 'connected' as const,
                  lastSyncAt: new Date(),
                  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                }
              : p
          ),
          isLoading: false,
        }));
        
        console.log(`Platform ${platformId} re-authenticated`);
      },

      syncPlatformData: async (platformId) => {
        set({ isLoading: true });
        
        // Simulate data sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set((state) => ({
          connectedPlatforms: state.connectedPlatforms.map(p =>
            p.id === platformId
              ? {
                  ...p,
                  lastSyncAt: new Date(),
                  metrics: {
                    ...p.metrics!,
                    totalSpend: p.metrics!.totalSpend + Math.random() * 100,
                    lastActivity: new Date(),
                  },
                }
              : p
          ),
          isLoading: false,
        }));
        
        console.log(`Platform ${platformId} data synced`);
      },

      updateNotificationPreferences: async (preferences) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            ...preferences,
            email: { ...state.notificationPreferences.email, ...preferences.email },
            push: { ...state.notificationPreferences.push, ...preferences.push },
            inApp: { ...state.notificationPreferences.inApp, ...preferences.inApp },
          },
          isLoading: false,
        }));
        
        console.log('Notification preferences updated:', preferences);
      },

      updateSecuritySettings: async (settings) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set((state) => ({
          securitySettings: {
            ...state.securitySettings,
            ...settings,
          },
          isLoading: false,
        }));
        
        console.log('Security settings updated:', settings);
      },

      enableTwoFactor: async () => {
        set({ isLoading: true });
        
        // Simulate 2FA setup
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const backupCodes = [
          'ABC123DEF456',
          'GHI789JKL012',
          'MNO345PQR678',
          'STU901VWX234',
          'YZA567BCD890',
        ];
        
        set((state) => ({
          securitySettings: {
            ...state.securitySettings,
            twoFactorEnabled: true,
          },
          isLoading: false,
        }));
        
        console.log('Two-factor authentication enabled');
        return { qrCode, backupCodes };
      },

      disableTwoFactor: async (code) => {
        set({ isLoading: true });
        
        // Simulate 2FA verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (code !== '123456') {
          set({ isLoading: false });
          throw new Error('Invalid verification code');
        }
        
        set((state) => ({
          securitySettings: {
            ...state.securitySettings,
            twoFactorEnabled: false,
          },
          isLoading: false,
        }));
        
        console.log('Two-factor authentication disabled');
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true });
        
        // Simulate password change
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (currentPassword !== 'demo123') {
          set({ isLoading: false });
          throw new Error('Current password is incorrect');
        }
        
        set((state) => ({
          securitySettings: {
            ...state.securitySettings,
            lastPasswordChange: new Date(),
          },
          isLoading: false,
        }));
        
        console.log('Password changed successfully');
      },

      initialize: async () => {
        set({ isLoading: true });
        
        // Simulate loading user settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for expired platform connections
        set((state) => ({
          connectedPlatforms: state.connectedPlatforms.map(platform => {
            if (platform.expiresAt && platform.expiresAt < new Date()) {
              return { ...platform, status: 'expired' as const };
            }
            return platform;
          }),
          isLoading: false,
        }));
        
        console.log('User settings initialized');
      },
    }),
    {
      name: 'user-settings-store',
    }
  )
); 