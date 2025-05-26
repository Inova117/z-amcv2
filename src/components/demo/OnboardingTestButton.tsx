import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OnboardingTestButton: React.FC = () => {
  const { user, updateOnboardingProgress } = useAuthStore();
  const { toast } = useToast();

  const resetOnboarding = () => {
    updateOnboardingProgress(0, false);
    toast({
      title: "Onboarding Reset",
      description: "Refresh the page to see the onboarding wizard.",
    });
  };

  if (user?.onboardingCompleted) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={resetOnboarding}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Onboarding (Test)
      </Button>
    );
  }

  return null;
}; 