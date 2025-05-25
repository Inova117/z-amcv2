import React from 'react';
import { CampaignBuilder } from '@/components/campaign/CampaignBuilder';

export const CampaignBuilderPage: React.FC = () => {
  const handleSave = (campaign: any) => {
    console.log('Campaign saved:', campaign);
    // Navigate to campaigns list or show success message
  };

  const handlePreview = () => {
    console.log('Campaign preview requested');
  };

  const handleLaunch = () => {
    console.log('Campaign launch requested');
    // Show launch confirmation or navigate to campaign dashboard
  };

  return (
    <div className="min-h-screen bg-background">
      <CampaignBuilder
        onSave={handleSave}
        onPreview={handlePreview}
        onLaunch={handleLaunch}
      />
    </div>
  );
}; 