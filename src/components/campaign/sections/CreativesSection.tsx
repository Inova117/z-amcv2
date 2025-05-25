import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Image, Plus, Trash2 } from 'lucide-react';
import { CampaignCreative } from '@/types/campaign';

export const CreativesSection: React.FC = () => {
  const { formData, updateFormData } = useCampaignStore();

  const addCreative = () => {
    const newCreative: CampaignCreative = {
      id: `creative-${Date.now()}`,
      type: 'image',
      headline: '',
      description: '',
      callToAction: 'Learn More',
      linkUrl: '',
    };
    
    updateFormData('creatives', [...formData.creatives, newCreative]);
  };

  const updateCreative = (id: string, updates: Partial<CampaignCreative>) => {
    const updatedCreatives = formData.creatives.map(creative =>
      creative.id === id ? { ...creative, ...updates } : creative
    );
    updateFormData('creatives', updatedCreatives);
  };

  const removeCreative = (id: string) => {
    const updatedCreatives = formData.creatives.filter(creative => creative.id !== id);
    updateFormData('creatives', updatedCreatives);
  };

  const isComplete = formData.creatives.length > 0 && 
    formData.creatives.every(c => c.headline && c.description && c.linkUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ad Creatives</h3>
          <p className="text-sm text-muted-foreground">
            Create compelling ads that drive results
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

      <div className="space-y-4">
        {formData.creatives.map((creative, index) => (
          <Card key={creative.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Creative #{index + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCreative(creative.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Creative Type</Label>
                  <Select
                    value={creative.type}
                    onValueChange={(value) => updateCreative(creative.id, { type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="text">Text Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Call to Action</Label>
                  <Select
                    value={creative.callToAction}
                    onValueChange={(value) => updateCreative(creative.id, { callToAction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Learn More">Learn More</SelectItem>
                      <SelectItem value="Shop Now">Shop Now</SelectItem>
                      <SelectItem value="Sign Up">Sign Up</SelectItem>
                      <SelectItem value="Download">Download</SelectItem>
                      <SelectItem value="Get Quote">Get Quote</SelectItem>
                      <SelectItem value="Contact Us">Contact Us</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Headline</Label>
                <Input
                  value={creative.headline}
                  onChange={(e) => updateCreative(creative.id, { headline: e.target.value })}
                  placeholder="Enter compelling headline"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {creative.headline.length}/60 characters
                </p>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={creative.description}
                  onChange={(e) => updateCreative(creative.id, { description: e.target.value })}
                  placeholder="Describe your offer or value proposition"
                  rows={3}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {creative.description.length}/150 characters
                </p>
              </div>

              <div>
                <Label>Landing Page URL</Label>
                <Input
                  value={creative.linkUrl}
                  onChange={(e) => updateCreative(creative.id, { linkUrl: e.target.value })}
                  placeholder="https://example.com/landing-page"
                  type="url"
                />
              </div>

              {creative.type !== 'text' && (
                <div>
                  <Label>Media Upload</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload {creative.type} or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addCreative}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Creative
        </Button>
      </div>
    </div>
  );
}; 