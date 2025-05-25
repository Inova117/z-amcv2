import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Target, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { PlatformConfig, GoogleAdsConfig, MetaConfig } from '@/types/campaign';

export const PlatformSelectionSection: React.FC = () => {
  const { formData, updateFormData, addValidationError, removeValidationError } = useCampaignStore();

  const handlePlatformToggle = (platform: 'google_ads' | 'meta', enabled: boolean) => {
    const updatedPlatforms = formData.platforms.map(p => 
      p.platform === platform ? { ...p, enabled } : p
    );
    updateFormData('platforms', updatedPlatforms);
    
    if (enabled) {
      removeValidationError(`platforms.${platform}`);
    }
  };

  const handlePlatformConfigUpdate = (
    platform: 'google_ads' | 'meta', 
    field: string, 
    value: any
  ) => {
    const updatedPlatforms = formData.platforms.map(p => 
      p.platform === platform ? { ...p, [field]: value } : p
    );
    updateFormData('platforms', updatedPlatforms);
  };

  const handlePlatformSettingsUpdate = (
    platform: 'google_ads' | 'meta',
    settings: Record<string, any>
  ) => {
    const updatedPlatforms = formData.platforms.map(p => 
      p.platform === platform ? { ...p, settings: { ...p.settings, ...settings } } : p
    );
    updateFormData('platforms', updatedPlatforms);
  };

  const googleAdsConfig = formData.platforms.find(p => p.platform === 'google_ads');
  const metaConfig = formData.platforms.find(p => p.platform === 'meta');

  const enabledPlatforms = formData.platforms.filter(p => p.enabled);

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Platform Selection</h3>
          <p className="text-sm text-muted-foreground">
            Choose where to run your campaign and configure platform-specific settings
          </p>
        </div>
        <Badge variant={enabledPlatforms.length > 0 ? "default" : "secondary"}>
          {enabledPlatforms.length} Platform{enabledPlatforms.length !== 1 ? 's' : ''} Selected
        </Badge>
      </div>

      {enabledPlatforms.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-800">
            Select at least one platform to continue
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Ads Platform */}
        <Card className={`transition-all ${googleAdsConfig?.enabled ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Ads</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search, Display, Shopping, Video
                  </p>
                </div>
              </div>
              <Switch
                checked={googleAdsConfig?.enabled || false}
                onCheckedChange={(enabled) => handlePlatformToggle('google_ads', enabled)}
              />
            </div>
          </CardHeader>
          
          {googleAdsConfig?.enabled && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="google-campaign-type">Campaign Type</Label>
                  <Select
                    value={googleAdsConfig.campaignType}
                    onValueChange={(value) => handlePlatformConfigUpdate('google_ads', 'campaignType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="search">Search</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="app">App</SelectItem>
                      <SelectItem value="smart">Smart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="google-objective">Objective</Label>
                  <Select
                    value={googleAdsConfig.objective}
                    onValueChange={(value) => handlePlatformConfigUpdate('google_ads', 'objective', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traffic">Drive Traffic</SelectItem>
                      <SelectItem value="conversions">Get Conversions</SelectItem>
                      <SelectItem value="leads">Generate Leads</SelectItem>
                      <SelectItem value="awareness">Build Awareness</SelectItem>
                      <SelectItem value="sales">Increase Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {googleAdsConfig.campaignType === 'search' && (
                <div className="space-y-3">
                  <Label>Network Settings</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Search Network</span>
                      <Switch
                        checked={googleAdsConfig.settings?.searchNetwork !== false}
                        onCheckedChange={(checked) => 
                          handlePlatformSettingsUpdate('google_ads', { searchNetwork: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Display Network</span>
                      <Switch
                        checked={googleAdsConfig.settings?.displayNetwork || false}
                        onCheckedChange={(checked) => 
                          handlePlatformSettingsUpdate('google_ads', { displayNetwork: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Search Partners</span>
                      <Switch
                        checked={googleAdsConfig.settings?.searchPartners || false}
                        onCheckedChange={(checked) => 
                          handlePlatformSettingsUpdate('google_ads', { searchPartners: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="google-ad-group">Ad Group Name</Label>
                <Input
                  id="google-ad-group"
                  value={googleAdsConfig.settings?.adGroupName || ''}
                  onChange={(e) => 
                    handlePlatformSettingsUpdate('google_ads', { adGroupName: e.target.value })
                  }
                  placeholder="Enter ad group name"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Account connected</span>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Meta Platform */}
        <Card className={`transition-all ${metaConfig?.enabled ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meta</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Facebook, Instagram, Messenger
                  </p>
                </div>
              </div>
              <Switch
                checked={metaConfig?.enabled || false}
                onCheckedChange={(enabled) => handlePlatformToggle('meta', enabled)}
              />
            </div>
          </CardHeader>
          
          {metaConfig?.enabled && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meta-campaign-type">Campaign Type</Label>
                  <Select
                    value={metaConfig.campaignType}
                    onValueChange={(value) => handlePlatformConfigUpdate('meta', 'campaignType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="traffic">Traffic</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="leads">Lead Generation</SelectItem>
                      <SelectItem value="app_promotion">App Promotion</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="meta-objective">Objective</Label>
                  <Select
                    value={metaConfig.objective}
                    onValueChange={(value) => handlePlatformConfigUpdate('meta', 'objective', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link_clicks">Link Clicks</SelectItem>
                      <SelectItem value="impressions">Impressions</SelectItem>
                      <SelectItem value="reach">Reach</SelectItem>
                      <SelectItem value="conversions">Conversions</SelectItem>
                      <SelectItem value="app_installs">App Installs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="meta-optimization">Optimization Goal</Label>
                <Select
                  value={metaConfig.settings?.optimizationGoal || ''}
                  onValueChange={(value) => 
                    handlePlatformSettingsUpdate('meta', { optimizationGoal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select optimization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link_clicks">Link Clicks</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="landing_page_views">Landing Page Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="meta-ad-set">Ad Set Name</Label>
                <Input
                  id="meta-ad-set"
                  value={metaConfig.settings?.adSetName || ''}
                  onChange={(e) => 
                    handlePlatformSettingsUpdate('meta', { adSetName: e.target.value })
                  }
                  placeholder="Enter ad set name"
                />
              </div>

              <div>
                <Label htmlFor="meta-pixel">Facebook Pixel ID (Optional)</Label>
                <Input
                  id="meta-pixel"
                  value={metaConfig.settings?.pixelId || ''}
                  onChange={(e) => 
                    handlePlatformSettingsUpdate('meta', { pixelId: e.target.value })
                  }
                  placeholder="Enter pixel ID"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Account connected</span>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Platform Comparison */}
      {enabledPlatforms.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h4 className="font-semibold mb-2">Estimated Reach</h4>
                <div className="space-y-1">
                  {googleAdsConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Google:</span> 2.5M - 3.2M
                    </div>
                  )}
                  {metaConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Meta:</span> 1.8M - 2.4M
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Est. Cost per Click</h4>
                <div className="space-y-1">
                  {googleAdsConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Google:</span> $1.20 - $2.80
                    </div>
                  )}
                  {metaConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Meta:</span> $0.85 - $1.95
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Competition Level</h4>
                <div className="space-y-1">
                  {googleAdsConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Google:</span> 
                      <Badge variant="secondary" className="ml-1">Medium</Badge>
                    </div>
                  )}
                  {metaConfig?.enabled && (
                    <div className="text-sm">
                      <span className="font-medium">Meta:</span> 
                      <Badge variant="secondary" className="ml-1">High</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handlePlatformToggle('google_ads', true);
            handlePlatformToggle('meta', true);
          }}
        >
          Enable All Platforms
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handlePlatformToggle('google_ads', false);
            handlePlatformToggle('meta', false);
          }}
        >
          Disable All
        </Button>
        
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Connect New Account
        </Button>
      </div>
    </div>
  );
}; 