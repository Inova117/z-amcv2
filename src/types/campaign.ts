export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: CampaignBudget;
  targeting: CampaignTargeting;
  creatives: CampaignCreative[];
  platforms: PlatformConfig[];
  schedule: CampaignSchedule;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CampaignBudget {
  type: 'daily' | 'lifetime';
  amount: number;
  currency: string;
  bidStrategy: 'manual' | 'auto' | 'target_cpa' | 'target_roas';
  bidAmount?: number;
}

export interface CampaignTargeting {
  demographics: {
    ageMin: number;
    ageMax: number;
    genders: string[];
    locations: string[];
    languages: string[];
  };
  interests: string[];
  behaviors: string[];
  customAudiences: string[];
  lookalikeSources: string[];
  deviceTypes: string[];
  placements: string[];
}

export interface CampaignCreative {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'text';
  headline: string;
  description: string;
  callToAction: string;
  mediaUrl?: string;
  mediaUrls?: string[]; // for carousel
  linkUrl: string;
  displayUrl?: string;
}

export interface PlatformConfig {
  platform: 'google_ads' | 'meta';
  enabled: boolean;
  campaignType: string;
  objective: string;
  settings: Record<string, any>;
}

export interface CampaignSchedule {
  startDate: string;
  endDate?: string;
  timezone: string;
  dayParting?: {
    days: number[];
    hours: number[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CampaignFormData {
  basic: {
    name: string;
    description: string;
    objective: string;
  };
  budget: CampaignBudget;
  targeting: CampaignTargeting;
  creatives: CampaignCreative[];
  platforms: PlatformConfig[];
  schedule: CampaignSchedule;
}

export interface DragItem {
  id: string;
  type: 'section' | 'field' | 'creative';
  data: any;
}

export interface CampaignBuilderSection {
  id: string;
  title: string;
  type: 'basic' | 'budget' | 'targeting' | 'creatives' | 'platforms' | 'schedule';
  required: boolean;
  completed: boolean;
  order: number;
}

// Platform-specific types
export interface GoogleAdsConfig {
  campaignType: 'search' | 'display' | 'shopping' | 'video' | 'app' | 'smart';
  networkSettings: {
    searchNetwork: boolean;
    displayNetwork: boolean;
    searchPartners: boolean;
  };
  keywords?: string[];
  negativeKeywords?: string[];
  adGroupName: string;
}

export interface MetaConfig {
  campaignType: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'app_promotion' | 'sales';
  objective: string;
  optimizationGoal: string;
  adSetName: string;
  pixelId?: string;
  customConversions?: string[];
}

export interface CampaignPreview {
  platform: string;
  estimatedReach: number;
  estimatedCost: {
    min: number;
    max: number;
  };
  recommendations: string[];
  warnings: ValidationError[];
} 