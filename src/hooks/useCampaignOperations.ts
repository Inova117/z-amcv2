import { useCampaignStore } from '@/store/campaignStore';
import { useAuthStore } from '@/store/authStore';
import { CampaignFormData, Campaign, ValidationError } from '@/types/campaign';
import { useToast } from '@/hooks/use-toast';

export const useCampaignOperations = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    optimisticUpdateCampaign,
    optimisticAddCampaign,
    optimisticRemoveCampaign,
    setValidationErrors,
    setSaving,
    markSaved,
    setLoading,
  } = useCampaignStore();

  const createCampaign = async (formData: CampaignFormData): Promise<Campaign> => {
    setSaving(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: formData.basic.name,
      description: formData.basic.description,
      status: 'draft',
      budget: formData.budget,
      targeting: formData.targeting,
      creatives: formData.creatives,
      platforms: formData.platforms,
      schedule: formData.schedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || 'demo-user',
    };

    optimisticAddCampaign(newCampaign);
    markSaved();
    setSaving(false);

    toast({
      title: "Campaign Created",
      description: `Campaign "${newCampaign.name}" has been created successfully.`,
    });

    return newCampaign;
  };

  const updateCampaign = async (campaignId: string, formData: CampaignFormData): Promise<Campaign> => {
    setSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const optimisticUpdates = {
        name: formData.basic.name,
        description: formData.basic.description,
        budget: formData.budget,
        targeting: formData.targeting,
        creatives: formData.creatives,
        platforms: formData.platforms,
        schedule: formData.schedule,
        updatedAt: new Date().toISOString(),
      };

      optimisticUpdateCampaign(campaignId, optimisticUpdates);
      markSaved();

      toast({
        title: "Campaign Updated",
        description: `Campaign has been updated successfully.`,
      });

      return { ...optimisticUpdates, id: campaignId } as Campaign;
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async (campaignId: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      optimisticRemoveCampaign(campaignId);

      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully.",
      });
    } catch (error) {
      throw error;
    }
  };

  const validateCampaign = async (formData: CampaignFormData): Promise<ValidationError[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const errors: ValidationError[] = [];

    if (!formData.basic.name) {
      errors.push({
        field: 'basic.name',
        message: 'Campaign name is required',
        severity: 'error',
      });
    }

    if (formData.budget.amount <= 0) {
      errors.push({
        field: 'budget.amount',
        message: 'Budget amount must be greater than 0',
        severity: 'error',
      });
    }

    if (!formData.platforms.some(p => p.enabled)) {
      errors.push({
        field: 'platforms',
        message: 'At least one platform must be selected',
        severity: 'error',
      });
    }

    if (formData.creatives.length === 0) {
      errors.push({
        field: 'creatives',
        message: 'At least one creative is required',
        severity: 'error',
      });
    }

    if (formData.budget.amount > 10000) {
      errors.push({
        field: 'budget.amount',
        message: 'High budget amount - consider starting with a smaller test budget',
        severity: 'warning',
      });
    }

    setValidationErrors(errors);
    return errors;
  };

  const getCampaignPreview = async (formData: CampaignFormData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        {
          platform: 'Google Ads',
          estimatedReach: Math.round(formData.budget.amount * 1000),
          estimatedCost: {
            min: formData.budget.amount * 0.8,
            max: formData.budget.amount * 1.2,
          },
          recommendations: [
            'Consider adding more keywords for better reach',
            'Your budget is well-suited for this audience size',
          ],
          warnings: [],
        },
        {
          platform: 'Meta',
          estimatedReach: Math.round(formData.budget.amount * 800),
          estimatedCost: {
            min: formData.budget.amount * 0.7,
            max: formData.budget.amount * 1.1,
          },
          recommendations: [
            'Add more interests for better targeting',
            'Consider using video creatives for higher engagement',
          ],
          warnings: [],
        },
      ];
    } catch (error) {
      console.error('Preview failed:', error);
      return [];
    }
  };

  const duplicateCampaign = async (campaignId: string, newName: string): Promise<Campaign> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duplicatedCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        name: newName,
        description: 'Duplicated campaign',
        status: 'draft',
        budget: { type: 'daily', amount: 100, currency: 'USD', bidStrategy: 'auto' },
        targeting: {
          demographics: { ageMin: 18, ageMax: 65, genders: [], locations: [], languages: ['en'] },
          interests: [],
          behaviors: [],
          customAudiences: [],
          lookalikeSources: [],
          deviceTypes: ['desktop', 'mobile'],
          placements: [],
        },
        creatives: [],
        platforms: [],
        schedule: { startDate: new Date().toISOString().split('T')[0], timezone: 'UTC' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || 'demo-user',
      };

      toast({
        title: "Campaign Duplicated",
        description: `Campaign "${duplicatedCampaign.name}" has been duplicated successfully.`,
      });

      return duplicatedCampaign;
    } catch (error) {
      throw error;
    }
  };

  return {
    createCampaign,
    updateCampaign,
    deleteCampaign,
    validateCampaign,
    getCampaignPreview,
    duplicateCampaign,
  };
}; 