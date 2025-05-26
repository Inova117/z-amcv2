import React, { useState, useEffect } from 'react';
import { useUserSettingsStore } from '@/store/userSettingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Bell, 
  Shield, 
  Link as LinkIcon, 
  Camera, 
  Save, 
  RefreshCw, 
  Unlink,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Key,
  Smartphone,
  Mail,
  Globe,
  Palette,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ProfileTab = () => {
  const { profile, updateProfile, uploadAvatar, isLoading } = useUserSettingsStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSave = async () => {
    try {
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      await updateProfile(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback className="text-lg">
                {formData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Camera className="h-4 w-4" />
                  Change Avatar
                </div>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
          </div>

          {/* Preferences */}
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={formData.theme} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NotificationsTab = () => {
  const { preferences, updatePreferences } = useNotificationStore();
  const { updateNotificationPreferences, isLoading } = useUserSettingsStore();
  const { toast } = useToast();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = async () => {
    try {
      await updateNotificationPreferences(localPreferences);
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateChannelPreference = (
    channel: keyof typeof localPreferences,
    type: string,
    value: boolean
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: value,
      },
    }));
  };

  const notificationTypes = [
    { key: 'system', label: 'System Messages', icon: Settings },
    { key: 'campaign', label: 'Campaign Updates', icon: Bell },
    { key: 'ai_recommendations', label: 'AI Recommendations', icon: Smartphone },
    { key: 'asset_approvals', label: 'Asset Approvals', icon: CheckCircle },
    { key: 'chat_mentions', label: 'Chat Mentions', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about different types of events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Channel Headers */}
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <div>Notification Type</div>
              <div className="text-center">Email</div>
              <div className="text-center">Push</div>
              <div className="text-center">In-App</div>
            </div>

            <Separator />

            {/* Notification Types */}
            {notificationTypes.map(({ key, label, icon: Icon }) => (
              <div key={key} className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={localPreferences.email[key as keyof typeof localPreferences.email]}
                    onCheckedChange={(checked) => updateChannelPreference('email', key, checked)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={localPreferences.push[key as keyof typeof localPreferences.push]}
                    onCheckedChange={(checked) => updateChannelPreference('push', key, checked)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={localPreferences.inApp[key as keyof typeof localPreferences.inApp]}
                    onCheckedChange={(checked) => updateChannelPreference('inApp', key, checked)}
                  />
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ConnectedPlatformsTab = () => {
  const { 
    connectedPlatforms, 
    connectPlatform, 
    disconnectPlatform, 
    refreshPlatformAuth, 
    syncPlatformData,
    isLoading 
  } = useUserSettingsStore();
  const { toast } = useToast();

  const platformIcons = {
    google_ads: '🔍',
    meta_ads: '📘',
    tiktok_ads: '🎵',
    linkedin_ads: '💼',
    twitter_ads: '🐦',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'expired': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'expired': return Clock;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleConnect = async (platformType: any) => {
    try {
      await connectPlatform(platformType);
      toast({
        title: "Platform connected",
        description: `Successfully connected to ${platformType.replace('_', ' ')}.`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await disconnectPlatform(platformId);
      toast({
        title: "Platform disconnected",
        description: "Platform has been successfully disconnected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async (platformId: string) => {
    try {
      await refreshPlatformAuth(platformId);
      toast({
        title: "Authentication refreshed",
        description: "Platform authentication has been renewed.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (platformId: string) => {
    try {
      await syncPlatformData(platformId);
      toast({
        title: "Data synced",
        description: "Platform data has been successfully synced.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync platform data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const availablePlatforms = [
    { type: 'google_ads', name: 'Google Ads' },
    { type: 'meta_ads', name: 'Meta Ads' },
    { type: 'tiktok_ads', name: 'TikTok Ads' },
    { type: 'linkedin_ads', name: 'LinkedIn Ads' },
    { type: 'twitter_ads', name: 'Twitter Ads' },
  ];

  const unconnectedPlatforms = availablePlatforms.filter(
    platform => !connectedPlatforms.some(cp => cp.type === platform.type)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Connected Platforms
          </CardTitle>
          <CardDescription>
            Manage your advertising platform connections and data synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedPlatforms.map((platform) => {
            const StatusIcon = getStatusIcon(platform.status);
            
            return (
              <Card key={platform.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {platformIcons[platform.type]}
                    </div>
                    <div>
                      <h3 className="font-medium">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {platform.accountInfo.accountName} • {platform.accountInfo.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-xs', getStatusColor(platform.status))}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                        </Badge>
                        {platform.lastSyncAt && (
                          <span className="text-xs text-muted-foreground">
                            Last sync: {platform.lastSyncAt.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {platform.status === 'expired' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefresh(platform.id)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Auth
                      </Button>
                    )}
                    
                    {platform.status === 'connected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(platform.id)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Data
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={isLoading}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>

                {platform.metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        ${platform.metrics.totalSpend.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Spend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {platform.metrics.activeCampaigns}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {platform.metrics.lastActivity.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Last Activity</div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {unconnectedPlatforms.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">Available Platforms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unconnectedPlatforms.map((platform) => (
                    <Card key={platform.type} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">
                            {platformIcons[platform.type as keyof typeof platformIcons]}
                          </div>
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(platform.type)}
                          disabled={isLoading}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SecurityTab = () => {
  const { securitySettings, updateSecuritySettings, enableTwoFactor, disableTwoFactor, changePassword, isLoading } = useUserSettingsStore();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      const { qrCode, backupCodes } = await enableTwoFactor();
      toast({
        title: "Two-factor authentication enabled",
        description: "Please save your backup codes in a secure location.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication.",
        variant: "destructive",
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disableTwoFactor(twoFactorCode);
      setTwoFactorCode('');
      toast({
        title: "Two-factor authentication disabled",
        description: "Your account is now using password-only authentication.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={isLoading}>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div>
            <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Two-factor authentication is {securitySettings.twoFactorEnabled ? 'enabled' : 'disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant={securitySettings.twoFactorEnabled ? 'default' : 'secondary'}>
                  {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {!securitySettings.twoFactorEnabled ? (
                <Button onClick={handleEnable2FA} disabled={isLoading}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="max-w-md">
                    <Label htmlFor="2fa-code">Enter verification code to disable</Label>
                    <Input
                      id="2fa-code"
                      placeholder="123456"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleDisable2FA} 
                    disabled={isLoading || !twoFactorCode}
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Session Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Session Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => 
                    updateSecuritySettings({ loginNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after {securitySettings.sessionTimeout} minutes of inactivity
                  </p>
                </div>
                <Select
                  value={securitySettings.sessionTimeout.toString()}
                  onValueChange={(value) => 
                    updateSecuritySettings({ sessionTimeout: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SettingsPage = () => {
  const { initialize } = useUserSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="platforms">
          <ConnectedPlatformsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 