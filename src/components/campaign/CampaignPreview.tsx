import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  X, 
  DollarSign, 
  Users, 
  Calendar, 
  Target,
  Image,
  MapPin
} from 'lucide-react';
import { CampaignFormData } from '@/types/campaign';

interface CampaignPreviewProps {
  formData: CampaignFormData;
  onClose: () => void;
  onLaunch: () => void;
}

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  formData,
  onClose,
  onLaunch,
}) => {
  const enabledPlatforms = formData.platforms.filter(p => p.enabled);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Campaign Preview</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{formData.basic.name}</h3>
                <p className="text-muted-foreground">{formData.basic.description}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Objective</p>
                  <Badge variant="secondary">{formData.basic.objective}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-lg font-bold">
                    {formData.budget.currency} {formData.budget.amount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{formData.budget.type}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Platforms</p>
                  <p className="text-lg font-bold">{enabledPlatforms.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Creatives</p>
                  <p className="text-lg font-bold">{formData.creatives.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enabledPlatforms.map((platform) => (
                  <div key={platform.platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">
                        {platform.platform.replace('_', ' ')}
                      </h4>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {platform.campaignType}</p>
                      <p><span className="font-medium">Objective:</span> {platform.objective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Targeting Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Targeting Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium mb-2">Demographics</p>
                  <p className="text-sm">
                    Age: {formData.targeting.demographics.ageMin}-{formData.targeting.demographics.ageMax}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Locations</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.targeting.demographics.locations.slice(0, 3).map((location, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                    {formData.targeting.demographics.locations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{formData.targeting.demographics.locations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.targeting.interests.slice(0, 3).map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {formData.targeting.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{formData.targeting.interests.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creative Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Creative Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.creatives.slice(0, 2).map((creative, index) => (
                  <div key={creative.id} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{creative.type}</Badge>
                        <Badge variant="secondary">{creative.callToAction}</Badge>
                      </div>
                      <h4 className="font-semibold">{creative.headline}</h4>
                      <p className="text-sm text-muted-foreground">{creative.description}</p>
                      <p className="text-xs text-blue-600 truncate">{creative.linkUrl}</p>
                    </div>
                  </div>
                ))}
                {formData.creatives.length > 2 && (
                  <div className="border rounded-lg p-4 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      +{formData.creatives.length - 2} more creatives
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Start Date</p>
                  <p className="text-sm">{formData.schedule.startDate}</p>
                </div>
                <div>
                  <p className="font-medium">End Date</p>
                  <p className="text-sm">{formData.schedule.endDate || 'No end date'}</p>
                </div>
                <div>
                  <p className="font-medium">Timezone</p>
                  <p className="text-sm">{formData.schedule.timezone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estimated Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(formData.budget.amount * 1000).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Reach</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(formData.budget.amount * 50)}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Clicks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(formData.budget.amount / Math.max(formData.budget.amount * 50, 1)).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. CPC</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(formData.budget.amount * 5)}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onClose}>
              Back to Editor
            </Button>
            <Button onClick={onLaunch} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 