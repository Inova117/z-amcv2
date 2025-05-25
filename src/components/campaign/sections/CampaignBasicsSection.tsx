import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  FileText, 
  Lightbulb, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

export const CampaignBasicsSection: React.FC = () => {
  const { formData, updateFormData, validationErrors, addValidationError, removeValidationError } = useCampaignStore();

  const handleNameChange = (value: string) => {
    updateFormData('basic', { name: value });
    
    if (value.trim()) {
      removeValidationError('basic.name');
    } else {
      addValidationError({
        field: 'basic.name',
        message: 'Campaign name is required',
        severity: 'error'
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    updateFormData('basic', { description: value });
    
    if (value.length > 500) {
      addValidationError({
        field: 'basic.description',
        message: 'Description should be under 500 characters',
        severity: 'warning'
      });
    } else {
      removeValidationError('basic.description');
    }
  };

  const handleObjectiveChange = (value: string) => {
    updateFormData('basic', { objective: value });
    removeValidationError('basic.objective');
  };

  const nameError = validationErrors.find(e => e.field === 'basic.name');
  const descriptionError = validationErrors.find(e => e.field === 'basic.description');
  const objectiveError = validationErrors.find(e => e.field === 'basic.objective');

  const isComplete = formData.basic.name && formData.basic.objective;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campaign Basics</h3>
          <p className="text-sm text-muted-foreground">
            Set up the fundamental details of your campaign
          </p>
        </div>
        <Badge variant={isComplete ? "default" : "secondary"}>
          {isComplete ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </>
          ) : (
            'Incomplete'
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Name */}
        <div className="space-y-2">
          <Label htmlFor="campaign-name" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Campaign Name *
          </Label>
          <Input
            id="campaign-name"
            value={formData.basic.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter a descriptive campaign name"
            className={nameError ? 'border-red-500' : ''}
          />
          {nameError && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {nameError.message}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Choose a name that clearly identifies this campaign's purpose
          </p>
        </div>

        {/* Campaign Objective */}
        <div className="space-y-2">
          <Label htmlFor="campaign-objective" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaign Objective *
          </Label>
          <Select
            value={formData.basic.objective}
            onValueChange={handleObjectiveChange}
          >
            <SelectTrigger className={objectiveError ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your main objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="awareness">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Brand Awareness</span>
                  <span className="text-xs text-muted-foreground">Increase visibility and recognition</span>
                </div>
              </SelectItem>
              <SelectItem value="traffic">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Drive Traffic</span>
                  <span className="text-xs text-muted-foreground">Send people to your website</span>
                </div>
              </SelectItem>
              <SelectItem value="engagement">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Engagement</span>
                  <span className="text-xs text-muted-foreground">Get likes, comments, and shares</span>
                </div>
              </SelectItem>
              <SelectItem value="leads">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Lead Generation</span>
                  <span className="text-xs text-muted-foreground">Collect contact information</span>
                </div>
              </SelectItem>
              <SelectItem value="conversions">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Conversions</span>
                  <span className="text-xs text-muted-foreground">Drive specific actions on your site</span>
                </div>
              </SelectItem>
              <SelectItem value="sales">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Sales</span>
                  <span className="text-xs text-muted-foreground">Increase online or offline sales</span>
                </div>
              </SelectItem>
              <SelectItem value="app_promotion">
                <div className="flex flex-col items-start">
                  <span className="font-medium">App Promotion</span>
                  <span className="text-xs text-muted-foreground">Get app installs or engagement</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {objectiveError && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {objectiveError.message}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Description */}
      <div className="space-y-2">
        <Label htmlFor="campaign-description" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Campaign Description
          <Badge variant="outline" className="text-xs">Optional</Badge>
        </Label>
        <Textarea
          id="campaign-description"
          value={formData.basic.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe your campaign goals, target audience, and key messaging..."
          rows={4}
          className={descriptionError?.severity === 'error' ? 'border-red-500' : ''}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {descriptionError && (
              <div className={`flex items-center gap-1 text-sm ${
                descriptionError.severity === 'error' ? 'text-red-600' : 'text-orange-600'
              }`}>
                <AlertCircle className="h-3 w-3" />
                {descriptionError.message}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formData.basic.description.length}/500 characters
          </span>
        </div>
      </div>

      {/* Objective-specific guidance */}
      {formData.basic.objective && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {getObjectiveGuidance(formData.basic.objective)}
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Name Suggestions */}
      {formData.basic.objective && !formData.basic.name && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggested Campaign Names
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getNameSuggestions(formData.basic.objective).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleNameChange(suggestion)}
                  className="text-left p-2 rounded border hover:bg-muted transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const getObjectiveGuidance = (objective: string): string => {
  const guidance: Record<string, string> = {
    awareness: "Focus on reach and impressions. Use engaging visuals and broad targeting to maximize visibility.",
    traffic: "Optimize for link clicks. Ensure your landing page is relevant and loads quickly.",
    engagement: "Create compelling content that encourages interaction. Use questions and calls-to-action.",
    leads: "Use lead forms or landing pages with clear value propositions. Offer something valuable in exchange for contact info.",
    conversions: "Set up conversion tracking. Optimize for your most valuable actions like purchases or sign-ups.",
    sales: "Focus on product catalogs and shopping ads. Use dynamic remarketing to show relevant products.",
    app_promotion: "Highlight key app features and benefits. Use app install or app engagement objectives."
  };
  
  return guidance[objective] || "Configure your campaign settings based on your specific goals.";
};

const getNameSuggestions = (objective: string): string[] => {
  const suggestions: Record<string, string[]> = {
    awareness: [
      "Brand Awareness Q1 2024",
      "New Product Launch Campaign",
      "Brand Recognition Drive",
      "Market Expansion Initiative"
    ],
    traffic: [
      "Website Traffic Boost",
      "Landing Page Visitors",
      "Blog Traffic Campaign",
      "Product Page Visits"
    ],
    engagement: [
      "Social Engagement Drive",
      "Community Building Campaign",
      "Content Interaction Boost",
      "User Engagement Initiative"
    ],
    leads: [
      "Lead Generation Campaign",
      "Newsletter Signup Drive",
      "Demo Request Campaign",
      "Contact Form Submissions"
    ],
    conversions: [
      "Conversion Optimization",
      "Purchase Funnel Campaign",
      "Action-Driven Campaign",
      "Goal Completion Drive"
    ],
    sales: [
      "Sales Boost Campaign",
      "Revenue Generation Drive",
      "Product Sales Push",
      "E-commerce Campaign"
    ],
    app_promotion: [
      "App Install Campaign",
      "Mobile App Promotion",
      "App Engagement Drive",
      "User Acquisition Campaign"
    ]
  };
  
  return suggestions[objective] || [
    "Marketing Campaign 2024",
    "Digital Advertising Initiative",
    "Customer Acquisition Drive",
    "Growth Marketing Campaign"
  ];
}; 