import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '@/store/campaignStore';
import { useAssetStore } from '@/store/assetStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Zap,
  Target,
  Upload,
  Eye,
  BarChart3,
  Rocket,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeroFlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'in-progress' | 'completed';
  action?: () => Promise<any>;
  route?: string;
}

export const HeroFlowDemo: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { optimisticAddCampaign } = useCampaignStore();
  const { optimisticAddAsset } = useAssetStore();
  const { setMetrics } = useAnalyticsStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const createDemoCampaign = async () => {
    const campaign = {
      id: `hero-campaign-${Date.now()}`,
      name: 'Hero Demo Campaign - Summer Sale 2024',
      description: 'AI-generated multi-platform campaign for summer product promotion',
      status: 'draft' as const,
      budget: {
        type: 'daily' as const,
        amount: 500,
        currency: 'USD',
        bidStrategy: 'auto' as const,
      },
      targeting: {
        demographics: {
          ageMin: 25,
          ageMax: 45,
          genders: ['all'],
          locations: ['US', 'CA'],
          languages: ['en'],
        },
        interests: ['technology', 'productivity', 'business'],
        behaviors: ['online_shoppers'],
        customAudiences: [],
        lookalikeSources: [],
        deviceTypes: ['desktop', 'mobile'],
        placements: ['feed', 'stories'],
      },
      creatives: [],
      platforms: [
        {
          platform: 'google_ads' as const,
          enabled: true,
          campaignType: 'search',
          objective: 'traffic',
          settings: {},
        },
        {
          platform: 'meta' as const,
          enabled: true,
          campaignType: 'traffic',
          objective: 'link_clicks',
          settings: {},
        },
      ],
      schedule: {
        startDate: new Date().toISOString().split('T')[0],
        timezone: 'America/New_York',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
    };

    optimisticAddCampaign(campaign);
    return campaign;
  };

  const createDemoAssets = async () => {
    const assets = [
      {
        id: `hero-asset-1-${Date.now()}`,
        name: 'Summer Sale Hero Banner.jpg',
        description: 'Main hero banner for summer sale campaign',
        type: 'image' as const,
        mimeType: 'image/jpeg',
        size: 1024000,
        url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200',
        status: 'approved' as const,
        tags: ['hero', 'summer', 'sale', 'banner'],
        metadata: {
          width: 1200,
          height: 630,
          format: 'jpeg',
          fileHash: 'hash-hero-1',
        },
        versions: [],
        approvals: [{
          id: 'approval-hero-1',
          status: 'approved' as const,
          reviewerId: 'demo-reviewer',
          reviewerName: 'AI Reviewer',
          comments: 'Excellent visual appeal and clear messaging',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        aiSuggestions: [{
          id: 'suggestion-hero-1',
          type: 'optimization' as const,
          title: 'A/B Test Suggestion',
          description: 'Try testing with a different CTA color for higher conversion',
          confidence: 0.85,
          actionable: true,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'demo-user',
      },
      {
        id: `hero-asset-2-${Date.now()}`,
        name: 'Product Showcase Video.mp4',
        description: 'Product demonstration video for social media',
        type: 'video' as const,
        mimeType: 'video/mp4',
        size: 5120000,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200',
        status: 'approved' as const,
        tags: ['product', 'demo', 'video', 'social'],
        metadata: {
          width: 1280,
          height: 720,
          duration: 30,
          format: 'mp4',
          fileHash: 'hash-hero-2',
        },
        versions: [],
        approvals: [{
          id: 'approval-hero-2',
          status: 'approved' as const,
          reviewerId: 'demo-reviewer',
          reviewerName: 'AI Reviewer',
          comments: 'Great product showcase with clear value proposition',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        aiSuggestions: [{
          id: 'suggestion-hero-2',
          type: 'usage' as const,
          title: 'Platform Optimization',
          description: 'Consider creating square version for Instagram feed',
          confidence: 0.92,
          actionable: true,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'demo-user',
      },
    ];

    assets.forEach(asset => optimisticAddAsset(asset));
    return assets;
  };

  const generateLiveAnalytics = async () => {
    const mockMetrics = [
      {
        campaignId: 'hero-campaign',
        campaignName: 'Hero Demo Campaign - Summer Sale 2024',
        platform: 'google_ads' as const,
        impressions: 15420,
        clicks: 892,
        spend: 245.50,
        conversions: 47,
        revenue: 2350.00,
        ctr: 5.78,
        cpc: 0.28,
        cpm: 15.92,
        roas: 9.57,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      },
      {
        campaignId: 'hero-campaign',
        campaignName: 'Hero Demo Campaign - Summer Sale 2024',
        platform: 'meta' as const,
        impressions: 23150,
        clicks: 1247,
        spend: 189.75,
        conversions: 62,
        revenue: 3100.00,
        ctr: 5.39,
        cpc: 0.15,
        cpm: 8.20,
        roas: 16.34,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      },
    ];

    setMetrics(mockMetrics);
    return mockMetrics;
  };

  const [steps, setSteps] = useState<HeroFlowStep[]>([
    {
      id: 'create-campaign',
      title: 'Create Campaign',
      description: 'AI generates multi-platform campaign strategy',
      icon: Target,
      status: 'pending',
      action: createDemoCampaign,
      route: '/campaigns/new',
    },
    {
      id: 'upload-assets',
      title: 'Upload Assets',
      description: 'Add creative assets with AI optimization',
      icon: Upload,
      status: 'pending',
      action: createDemoAssets,
      route: '/assets',
    },
    {
      id: 'review-approve',
      title: 'Review & Approve',
      description: 'AI-powered content review and approval',
      icon: Eye,
      status: 'pending',
    },
    {
      id: 'deploy',
      title: 'Deploy Campaign',
      description: 'Launch across all connected platforms',
      icon: Rocket,
      status: 'pending',
    },
    {
      id: 'live-analytics',
      title: 'Live Analytics',
      description: 'Real-time performance monitoring',
      icon: BarChart3,
      status: 'pending',
      action: generateLiveAnalytics,
      route: '/analytics',
    },
  ]);

  const runHeroFlow = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        // Update step status to in-progress
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'in-progress' } : step
        ));

        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Execute step action if available
        if (steps[i].action) {
          await steps[i].action!();
        }

        // Mark step as completed
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed' } : step
        ));
        
        setCompletedSteps(prev => [...prev, steps[i].id]);

        // Show step completion toast
        toast({
          title: `${steps[i].title} Complete!`,
          description: steps[i].description,
        });
      }

      // Final success message
      toast({
        title: "🎉 Hero Flow Complete!",
        description: "Your campaign is live and generating results. Check the analytics dashboard for real-time performance.",
      });

    } catch (error) {
      toast({
        title: "Flow Error",
        description: "Something went wrong during the hero flow execution.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const navigateToStep = (step: HeroFlowStep) => {
    if (step.route) {
      navigate(step.route);
    }
  };

  const progress = completedSteps.length / steps.length * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-blue-600" />
              ZAMC Hero Flow Demo
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Experience the complete end-to-end campaign creation process
            </p>
          </div>
          
          <Button
            onClick={runHeroFlow}
            disabled={isRunning}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Hero Flow
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {completedSteps.length} of {steps.length} steps completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index && isRunning;
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in-progress';

            return (
              <div key={step.id} className="relative">
                <div className={`
                  flex items-center gap-4 p-4 rounded-lg border transition-all
                  ${isActive ? 'border-blue-500 bg-blue-50' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-50' : ''}
                  ${!isActive && !isCompleted ? 'border-gray-200' : ''}
                `}>
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isInProgress ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : isInProgress ? (
                      <Clock className="h-6 w-6 animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      )}
                      {isInProgress && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {step.route && (isCompleted || !isRunning) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToStep(step)}
                      className="flex items-center gap-2"
                    >
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div className={`
                    w-0.5 h-6 ml-6 transition-colors
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Results Preview */}
        {completedSteps.length === steps.length && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Live Campaign Results
            </h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">38,570</div>
                  <div className="text-sm text-muted-foreground">Total Impressions</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">2,139</div>
                  <div className="text-sm text-muted-foreground">Total Clicks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">12.5x</div>
                  <div className="text-sm text-muted-foreground">Average ROAS</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center">
              <Button
                onClick={() => navigate('/analytics')}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Full Analytics Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">What happens in the Hero Flow?</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• AI creates optimized multi-platform campaign strategy</li>
                <li>• Smart asset upload with automatic optimization suggestions</li>
                <li>• Automated content review and approval workflow</li>
                <li>• One-click deployment across all connected platforms</li>
                <li>• Real-time analytics and performance monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 