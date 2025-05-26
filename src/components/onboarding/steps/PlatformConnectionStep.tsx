import React, { useState } from 'react';
import { useUserSettingsStore } from '@/store/userSettingsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  Target,
  Users,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformData {
  selectedPlatforms: string[];
  connectedPlatforms: string[];
}

interface PlatformConnectionStepProps {
  data: PlatformData;
  onUpdate: (data: Partial<PlatformData>) => void;
}

const PLATFORMS = [
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Reach customers on Google Search, YouTube, and partner sites',
    icon: '🔍',
    color: 'bg-blue-500',
    features: ['Search Ads', 'Display Network', 'YouTube Ads', 'Shopping Ads'],
    audience: '4.3B+ users',
    recommended: true,
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Advertise on Facebook, Instagram, and Messenger',
    icon: '📘',
    color: 'bg-blue-600',
    features: ['Facebook Ads', 'Instagram Ads', 'Stories', 'Reels'],
    audience: '3.8B+ users',
    recommended: true,
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'Engage with Gen Z and millennials on TikTok',
    icon: '🎵',
    color: 'bg-black',
    features: ['In-Feed Ads', 'Branded Effects', 'TopView', 'Spark Ads'],
    audience: '1B+ users',
    recommended: false,
  },
  {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    description: 'Target professionals and B2B audiences',
    icon: '💼',
    color: 'bg-blue-700',
    features: ['Sponsored Content', 'Message Ads', 'Lead Gen Forms', 'Event Ads'],
    audience: '900M+ professionals',
    recommended: false,
  },
  {
    id: 'twitter_ads',
    name: 'Twitter Ads',
    description: 'Join conversations and trending topics',
    icon: '🐦',
    color: 'bg-sky-500',
    features: ['Promoted Tweets', 'Trends', 'Moments', 'Video Ads'],
    audience: '450M+ users',
    recommended: false,
  },
];

export const PlatformConnectionStep: React.FC<PlatformConnectionStepProps> = ({ data, onUpdate }) => {
  const { connectPlatform } = useUserSettingsStore();
  const { toast } = useToast();
  const [connectingPlatforms, setConnectingPlatforms] = useState<string[]>([]);

  const handlePlatformToggle = (platformId: string) => {
    const isSelected = data.selectedPlatforms.includes(platformId);
    const newSelected = isSelected
      ? data.selectedPlatforms.filter(id => id !== platformId)
      : [...data.selectedPlatforms, platformId];
    
    onUpdate({ selectedPlatforms: newSelected });
  };

  const handleConnect = async (platformId: string) => {
    setConnectingPlatforms(prev => [...prev, platformId]);
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate platform connection
      await connectPlatform(platformId as any);
      
      onUpdate({ 
        connectedPlatforms: [...data.connectedPlatforms, platformId] 
      });

      toast({
        title: "Platform Connected!",
        description: `Successfully connected to ${PLATFORMS.find(p => p.id === platformId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setConnectingPlatforms(prev => prev.filter(id => id !== platformId));
    }
  };

  const handleSelectRecommended = () => {
    const recommendedIds = PLATFORMS.filter(p => p.recommended).map(p => p.id);
    onUpdate({ selectedPlatforms: recommendedIds });
  };

  const selectedCount = data.selectedPlatforms.length;
  const connectedCount = data.connectedPlatforms.length;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-2">Connect Your Ad Platforms</h3>
        <p className="text-gray-600">
          Choose which platforms you'd like to advertise on and connect your accounts
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleSelectRecommended}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Select Recommended
          </Button>
          
          <div className="text-sm text-gray-600">
            {selectedCount} platform{selectedCount !== 1 ? 's' : ''} selected
          </div>
        </div>

        {selectedCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {connectedCount}/{selectedCount} connected
          </Badge>
        )}
      </div>

      {/* Platform Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const isSelected = data.selectedPlatforms.includes(platform.id);
          const isConnected = data.connectedPlatforms.includes(platform.id);
          const isConnecting = connectingPlatforms.includes(platform.id);

          return (
            <Card 
              key={platform.id} 
              className={`relative transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        {platform.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {isConnected && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{platform.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  {platform.audience}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="pt-3 border-t">
                    {isConnected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        className="w-full"
                        size="sm"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect Account
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Progress */}
      {selectedCount > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Connection Progress</h4>
              <span className="text-sm text-gray-600">
                {connectedCount} of {selectedCount} platforms connected
              </span>
            </div>
            
            <Progress value={(connectedCount / selectedCount) * 100} className="mb-4" />
            
            <div className="grid gap-2">
              {data.selectedPlatforms.map((platformId) => {
                const platform = PLATFORMS.find(p => p.id === platformId);
                const isConnected = data.connectedPlatforms.includes(platformId);
                const isConnecting = connectingPlatforms.includes(platformId);
                
                return (
                  <div key={platformId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${platform?.color} flex items-center justify-center text-white text-sm`}>
                        {platform?.icon}
                      </div>
                      <span className="text-sm">{platform?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : isConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900">Secure OAuth Connection</h4>
            <p className="text-sm text-green-700 mt-1">
              We use industry-standard OAuth 2.0 to securely connect your accounts. 
              ZAMC never stores your platform passwords and you can revoke access at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Why connect multiple platforms?</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Cross-platform campaign management from one dashboard</li>
              <li>• Unified analytics and performance tracking</li>
              <li>• AI-powered budget optimization across platforms</li>
              <li>• Automated audience syncing and lookalike creation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 