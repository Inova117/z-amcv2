import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Campaign, CampaignFormData, ValidationError, CampaignBuilderSection } from '@/types/campaign';

interface CampaignStore {
  // State
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  formData: CampaignFormData;
  sections: CampaignBuilderSection[];
  validationErrors: ValidationError[];
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  updateFormData: (section: keyof CampaignFormData, data: any) => void;
  updateFormField: (section: keyof CampaignFormData, field: string, value: any) => void;
  addValidationError: (error: ValidationError) => void;
  removeValidationError: (field: string) => void;
  clearValidationErrors: () => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  updateSection: (sectionId: string, updates: Partial<CampaignBuilderSection>) => void;
  reorderSections: (sections: CampaignBuilderSection[]) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setDirty: (dirty: boolean) => void;
  markSaved: () => void;
  resetForm: () => void;
  initializeForm: (campaign?: Campaign) => void;
  
  // Optimistic updates
  optimisticUpdateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  optimisticAddCampaign: (campaign: Campaign) => void;
  optimisticRemoveCampaign: (campaignId: string) => void;
  
  // Helper methods
  validateSectionCompletion: (sectionType: CampaignBuilderSection['type']) => boolean;
}

const defaultFormData: CampaignFormData = {
  basic: {
    name: '',
    description: '',
    objective: '',
  },
  budget: {
    type: 'daily',
    amount: 0,
    currency: 'USD',
    bidStrategy: 'auto',
  },
  targeting: {
    demographics: {
      ageMin: 18,
      ageMax: 65,
      genders: [],
      locations: [],
      languages: ['en'],
    },
    interests: [],
    behaviors: [],
    customAudiences: [],
    lookalikeSources: [],
    deviceTypes: ['desktop', 'mobile'],
    placements: [],
  },
  creatives: [],
  platforms: [
    {
      platform: 'google_ads',
      enabled: false,
      campaignType: 'search',
      objective: 'traffic',
      settings: {},
    },
    {
      platform: 'meta',
      enabled: false,
      campaignType: 'traffic',
      objective: 'link_clicks',
      settings: {},
    },
  ],
  schedule: {
    startDate: new Date().toISOString().split('T')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

const defaultSections: CampaignBuilderSection[] = [
  {
    id: 'basic',
    title: 'Campaign Basics',
    type: 'basic',
    required: true,
    completed: false,
    order: 1,
  },
  {
    id: 'platforms',
    title: 'Platform Selection',
    type: 'platforms',
    required: true,
    completed: false,
    order: 2,
  },
  {
    id: 'budget',
    title: 'Budget & Bidding',
    type: 'budget',
    required: true,
    completed: false,
    order: 3,
  },
  {
    id: 'targeting',
    title: 'Audience Targeting',
    type: 'targeting',
    required: true,
    completed: false,
    order: 4,
  },
  {
    id: 'creatives',
    title: 'Ad Creatives',
    type: 'creatives',
    required: true,
    completed: false,
    order: 5,
  },
  {
    id: 'schedule',
    title: 'Schedule & Timing',
    type: 'schedule',
    required: false,
    completed: false,
    order: 6,
  },
];

export const useCampaignStore = create<CampaignStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      campaigns: [],
      currentCampaign: null,
      formData: defaultFormData,
      sections: defaultSections,
      validationErrors: [],
      isLoading: false,
      isSaving: false,
      isDirty: false,
      lastSaved: null,

      // Actions
      setCampaigns: (campaigns) => set({ campaigns }),
      
      setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
      
      updateFormData: (section, data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: { ...state.formData[section], ...data },
          },
          isDirty: true,
        }));
        
        // Auto-validate section completion
        const { sections } = get();
        const sectionConfig = sections.find(s => s.type === section);
        if (sectionConfig) {
          get().updateSection(sectionConfig.id, { 
            completed: get().validateSectionCompletion(section) 
          });
        }
      },
      
      updateFormField: (section, field, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: {
              ...state.formData[section],
              [field]: value,
            },
          },
          isDirty: true,
        }));
      },
      
      addValidationError: (error) => {
        set((state) => ({
          validationErrors: [
            ...state.validationErrors.filter(e => e.field !== error.field),
            error,
          ],
        }));
      },
      
      removeValidationError: (field) => {
        set((state) => ({
          validationErrors: state.validationErrors.filter(e => e.field !== field),
        }));
      },
      
      clearValidationErrors: () => set({ validationErrors: [] }),
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      
      updateSection: (sectionId, updates) => {
        set((state) => ({
          sections: state.sections.map(section =>
            section.id === sectionId ? { ...section, ...updates } : section
          ),
        }));
      },
      
      reorderSections: (sections) => {
        const reorderedSections = sections.map((section, index) => ({
          ...section,
          order: index + 1,
        }));
        set({ sections: reorderedSections });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSaving: (saving) => set({ isSaving: saving }),
      
      setDirty: (dirty) => set({ isDirty: dirty }),
      
      markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
      
      resetForm: () => set({ 
        formData: defaultFormData, 
        sections: defaultSections,
        validationErrors: [],
        isDirty: false,
        currentCampaign: null,
      }),
      
      initializeForm: (campaign) => {
        if (campaign) {
          const formData: CampaignFormData = {
            basic: {
              name: campaign.name,
              description: campaign.description || '',
              objective: campaign.platforms[0]?.objective || '',
            },
            budget: campaign.budget,
            targeting: campaign.targeting,
            creatives: campaign.creatives,
            platforms: campaign.platforms,
            schedule: campaign.schedule,
          };
          
          set({ 
            formData,
            currentCampaign: campaign,
            isDirty: false,
            validationErrors: [],
          });
          
          // Update section completion status
          const { sections } = get();
          const updatedSections = sections.map(section => ({
            ...section,
            completed: get().validateSectionCompletion(section.type),
          }));
          set({ sections: updatedSections });
        } else {
          get().resetForm();
        }
      },
      
      // Optimistic updates
      optimisticUpdateCampaign: (campaignId, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map(campaign =>
            campaign.id === campaignId ? { ...campaign, ...updates } : campaign
          ),
          currentCampaign: state.currentCampaign?.id === campaignId 
            ? { ...state.currentCampaign, ...updates }
            : state.currentCampaign,
        }));
      },
      
      optimisticAddCampaign: (campaign) => {
        set((state) => ({
          campaigns: [...state.campaigns, campaign],
        }));
      },
      
      optimisticRemoveCampaign: (campaignId) => {
        set((state) => ({
          campaigns: state.campaigns.filter(c => c.id !== campaignId),
          currentCampaign: state.currentCampaign?.id === campaignId 
            ? null 
            : state.currentCampaign,
        }));
      },
      
      // Helper method for section validation
      validateSectionCompletion: (sectionType: CampaignBuilderSection['type']) => {
        const { formData } = get();
        
        switch (sectionType) {
          case 'basic':
            return !!(formData.basic.name && formData.basic.objective);
          case 'platforms':
            return formData.platforms.some(p => p.enabled);
          case 'budget':
            return !!(formData.budget.amount > 0 && formData.budget.currency);
          case 'targeting':
            return !!(
              formData.targeting.demographics.locations.length > 0 ||
              formData.targeting.interests.length > 0
            );
          case 'creatives':
            return formData.creatives.length > 0;
          case 'schedule':
            return !!formData.schedule.startDate;
          default:
            return false;
        }
      },
    }),
    {
      name: 'campaign-store',
    }
  )
); 