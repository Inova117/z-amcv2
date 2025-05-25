import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useCampaignStore } from '@/store/campaignStore';
import { useAuthStore } from '@/store/authStore';
import { 
  CREATE_CAMPAIGN, 
  UPDATE_CAMPAIGN, 
  DELETE_CAMPAIGN,
  VALIDATE_CAMPAIGN,
  GET_CAMPAIGN_PREVIEW,
  GET_CAMPAIGNS,
  GET_CAMPAIGN,
  DUPLICATE_CAMPAIGN
} from '@/lib/graphql/campaign';
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

  // Mutations
  const [createCampaignMutation] = useMutation(CREATE_CAMPAIGN, {
    onCompleted: (data) => {
      markSaved();
      toast({
        title: "Campaign Created",
        description: `Campaign "${data.createCampaign.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchQueries: [{ query: GET_CAMPAIGNS, variables: { userId: user?.id } }],
  });

  const [updateCampaignMutation] = useMutation(UPDATE_CAMPAIGN, {
    onCompleted: (data) => {
      markSaved();
      toast({
        title: "Campaign Updated",
        description: `Campaign "${data.updateCampaign.name}" has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [deleteCampaignMutation] = useMutation(DELETE_CAMPAIGN, {
    onCompleted: () => {
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Deleting Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchQueries: [{ query: GET_CAMPAIGNS, variables: { userId: user?.id } }],
  });

  const [validateCampaignMutation] = useMutation(VALIDATE_CAMPAIGN, {
    onCompleted: (data) => {
      const allErrors = [
        ...data.validateCampaign.errors,
        ...data.validateCampaign.warnings,
      ];
      setValidationErrors(allErrors);
    },
    onError: (error) => {
      console.error('Validation error:', error);
    },
  });

  const [duplicateCampaignMutation] = useMutation(DUPLICATE_CAMPAIGN, {
    onCompleted: (data) => {
      toast({
        title: "Campaign Duplicated",
        description: `Campaign "${data.duplicateCampaign.name}" has been duplicated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Duplicating Campaign",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchQueries: [{ query: GET_CAMPAIGNS, variables: { userId: user?.id } }],
  });

  // Lazy queries
  const [getCampaignPreviewQuery] = useLazyQuery(GET_CAMPAIGN_PREVIEW, {
    onCompleted: (data) => {
      // Handle preview data - could show in a modal or update state
      console.log('Campaign preview:', data.campaignPreview);
    },
    onError: (error) => {
      toast({
        title: "Error Getting Preview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const createCampaign = async (formData: CampaignFormData): Promise<Campaign> => {
    setSaving(true);
    
    try {
      // Create optimistic campaign for immediate UI feedback
      const optimisticCampaign: Campaign = {
        id: `temp-${Date.now()}`,
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
        userId: user?.id || '',
      };

      optimisticAddCampaign(optimisticCampaign);

      const { data } = await createCampaignMutation({
        variables: {
          input: {
            name: formData.basic.name,
            description: formData.basic.description,
            budget: formData.budget,
            targeting: formData.targeting,
            creatives: formData.creatives,
            platforms: formData.platforms,
            schedule: formData.schedule,
            userId: user?.id,
          },
        },
      });

      // Remove optimistic campaign and add real one
      optimisticRemoveCampaign(optimisticCampaign.id);
      
      return data.createCampaign;
    } catch (error) {
      // Remove optimistic campaign on error
      optimisticRemoveCampaign(`temp-${Date.now()}`);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateCampaign = async (campaignId: string, formData: CampaignFormData): Promise<Campaign> => {
    setSaving(true);
    
    try {
      // Optimistic update
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

      const { data } = await updateCampaignMutation({
        variables: {
          id: campaignId,
          input: {
            name: formData.basic.name,
            description: formData.basic.description,
            budget: formData.budget,
            targeting: formData.targeting,
            creatives: formData.creatives,
            platforms: formData.platforms,
            schedule: formData.schedule,
          },
        },
      });

      return data.updateCampaign;
    } catch (error) {
      // Revert optimistic update on error
      // In a real app, you'd want to revert to the previous state
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async (campaignId: string): Promise<void> => {
    try {
      // Optimistic removal
      optimisticRemoveCampaign(campaignId);

      await deleteCampaignMutation({
        variables: { id: campaignId },
      });
    } catch (error) {
      // In a real app, you'd want to restore the campaign on error
      throw error;
    }
  };

  const validateCampaign = async (formData: CampaignFormData): Promise<ValidationError[]> => {
    try {
      const { data } = await validateCampaignMutation({
        variables: {
          input: {
            name: formData.basic.name,
            description: formData.basic.description,
            budget: formData.budget,
            targeting: formData.targeting,
            creatives: formData.creatives,
            platforms: formData.platforms,
            schedule: formData.schedule,
            userId: user?.id,
          },
        },
      });

      return [
        ...data.validateCampaign.errors,
        ...data.validateCampaign.warnings,
      ];
    } catch (error) {
      console.error('Validation failed:', error);
      return [];
    }
  };

  const getCampaignPreview = async (formData: CampaignFormData) => {
    try {
      const { data } = await getCampaignPreviewQuery({
        variables: {
          input: {
            name: formData.basic.name,
            description: formData.basic.description,
            budget: formData.budget,
            targeting: formData.targeting,
            creatives: formData.creatives,
            platforms: formData.platforms,
            schedule: formData.schedule,
            userId: user?.id,
          },
        },
      });

      return data?.campaignPreview || [];
    } catch (error) {
      console.error('Preview failed:', error);
      return [];
    }
  };

  const duplicateCampaign = async (campaignId: string, newName: string): Promise<Campaign> => {
    try {
      const { data } = await duplicateCampaignMutation({
        variables: {
          id: campaignId,
          name: newName,
        },
      });

      return data.duplicateCampaign;
    } catch (error) {
      throw error;
    }
  };

  // Simulated operations for demo purposes (when backend is not available)
  const simulateCreateCampaign = async (formData: CampaignFormData): Promise<Campaign> => {
    setSaving(true);
    
    // Simulate API delay
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
      title: "Campaign Created (Demo)",
      description: `Campaign "${newCampaign.name}" has been created successfully.`,
    });

    return newCampaign;
  };

  const simulateValidation = async (formData: CampaignFormData): Promise<ValidationError[]> => {
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const errors: ValidationError[] = [];

    // Basic validation
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

    // Warnings
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

  return {
    createCampaign: process.env.NODE_ENV === 'development' ? simulateCreateCampaign : createCampaign,
    updateCampaign,
    deleteCampaign,
    validateCampaign: process.env.NODE_ENV === 'development' ? simulateValidation : validateCampaign,
    getCampaignPreview,
    duplicateCampaign,
  };
}; 