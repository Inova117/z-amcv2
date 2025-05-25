import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CheckCircle, Users, MapPin, Heart } from 'lucide-react';

export const TargetingSection: React.FC = () => {
  const { formData, updateFormData } = useCampaignStore();

  const handleAgeChange = (values: number[]) => {
    updateFormData('targeting', {
      demographics: {
        ...formData.targeting.demographics,
        ageMin: values[0],
        ageMax: values[1],
      }
    });
  };

  const handleLocationAdd = (location: string) => {
    if (location.trim()) {
      const newLocations = [...formData.targeting.demographics.locations, location.trim()];
      updateFormData('targeting', {
        demographics: {
          ...formData.targeting.demographics,
          locations: newLocations,
        }
      });
    }
  };

  const handleInterestAdd = (interest: string) => {
    if (interest.trim()) {
      const newInterests = [...formData.targeting.interests, interest.trim()];
      updateFormData('targeting', { interests: newInterests });
    }
  };

  const isComplete = formData.targeting.demographics.locations.length > 0 || formData.targeting.interests.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audience Targeting</h3>
          <p className="text-sm text-muted-foreground">
            Define who should see your ads
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

      {/* Age Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Age Range
        </Label>
        <div className="px-3">
          <Slider
            value={[formData.targeting.demographics.ageMin, formData.targeting.demographics.ageMax]}
            onValueChange={handleAgeChange}
            min={13}
            max={65}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{formData.targeting.demographics.ageMin}</span>
            <span>{formData.targeting.demographics.ageMax}+</span>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Target Locations
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter city, state, or country"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLocationAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter city, state, or country"]') as HTMLInputElement;
              if (input) {
                handleLocationAdd(input.value);
                input.value = '';
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.targeting.demographics.locations.map((location, index) => (
            <Badge key={index} variant="secondary">
              {location}
            </Badge>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Interests
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter interests or hobbies"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleInterestAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter interests or hobbies"]') as HTMLInputElement;
              if (input) {
                handleInterestAdd(input.value);
                input.value = '';
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.targeting.interests.map((interest, index) => (
            <Badge key={index} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}; 