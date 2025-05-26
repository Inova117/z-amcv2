import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUserSettingsStore } from '@/store/userSettingsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  User,
  Link,
  FileText,
  Sparkles
} from 'lucide-react';
import { AccountInfoStep } from './steps/AccountInfoStep';
import { PlatformConnectionStep } from './steps/PlatformConnectionStep';
import { CampaignBriefStep } from './steps/CampaignBriefStep';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  accountInfo: {
    name: string;
    title: string;
    company: string;
    timezone: string;
    language: string;
    avatar?: string;
  };
  platforms: {
    selectedPlatforms: string[];
    connectedPlatforms: string[];
  };
  campaignBrief: {
    objective: string;
    budget: number;
    targetAudience: string;
    industry: string;
    goals: string[];
    timeline: string;
  };
}

const STEPS = [
  {
    id: 1,
    title: 'Account Information',
    description: 'Tell us about yourself and your business',
    icon: User,
  },
  {
    id: 2,
    title: 'Connect Platforms',
    description: 'Link your advertising accounts',
    icon: Link,
  },
  {
    id: 3,
    title: 'Campaign Brief',
    description: 'Share your marketing goals',
    icon: FileText,
  },
];

export const OnboardingWizard: React.FC = () => {
  const { user, updateOnboardingProgress, completeOnboarding } = useAuthStore();
  const { updateProfile } = useUserSettingsStore();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(user?.onboardingStep || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    accountInfo: {
      name: user?.name || '',
      title: '',
      company: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
    },
    platforms: {
      selectedPlatforms: [],
      connectedPlatforms: [],
    },
    campaignBrief: {
      objective: '',
      budget: 1000,
      targetAudience: '',
      industry: '',
      goals: [],
      timeline: '30',
    },
  });

  const updateStepData = (step: keyof OnboardingData, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data },
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          onboardingData.accountInfo.name &&
          onboardingData.accountInfo.company &&
          onboardingData.accountInfo.title
        );
      case 2:
        return onboardingData.platforms.selectedPlatforms.length > 0;
      case 3:
        return !!(
          onboardingData.campaignBrief.objective &&
          onboardingData.campaignBrief.targetAudience &&
          onboardingData.campaignBrief.industry &&
          onboardingData.campaignBrief.goals.length > 0
        );
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all the required information before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateOnboardingProgress(nextStep);
    } else {
      // Complete onboarding
      await handleComplete();
    }
    
    setIsLoading(false);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateOnboardingProgress(prevStep);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Update user profile
      await updateProfile({
        name: onboardingData.accountInfo.name,
        title: onboardingData.accountInfo.title,
        company: onboardingData.accountInfo.company,
        timezone: onboardingData.accountInfo.timezone,
        language: onboardingData.accountInfo.language,
        avatar: onboardingData.accountInfo.avatar,
      });

      // Complete onboarding
      completeOnboarding();

      toast({
        title: "Welcome to ZAMC! 🎉",
        description: "Your account is set up and ready to go. Let's create your first campaign!",
      });
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "There was an issue completing your setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountInfoStep
            data={onboardingData.accountInfo}
            onUpdate={(data) => updateStepData('accountInfo', data)}
          />
        );
      case 2:
        return (
          <PlatformConnectionStep
            data={onboardingData.platforms}
            onUpdate={(data) => updateStepData('platforms', data)}
          />
        );
      case 3:
        return (
          <CampaignBriefStep
            data={onboardingData.campaignBrief}
            onUpdate={(data) => updateStepData('campaignBrief', data)}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / 3) * 100;
  const currentStepInfo = STEPS.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome to ZAMC</h1>
          </div>
          <p className="text-lg text-gray-600">
            Let's get your account set up in just a few steps
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`
                      w-24 h-1 mx-4 transition-colors
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h2 className="text-xl font-semibold">{currentStepInfo?.title}</h2>
              <p className="text-gray-600">{currentStepInfo?.description}</p>
            </div>
            <Badge variant="outline">
              Step {currentStep} of 3
            </Badge>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!validateStep(currentStep) || isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              'Processing...'
            ) : currentStep === 3 ? (
              'Complete Setup'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 