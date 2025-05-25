import React from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar, Clock } from 'lucide-react';

export const ScheduleSection: React.FC = () => {
  const { formData, updateFormData } = useCampaignStore();

  const handleStartDateChange = (startDate: string) => {
    updateFormData('schedule', { startDate });
  };

  const handleEndDateChange = (endDate: string) => {
    updateFormData('schedule', { endDate });
  };

  const handleTimezoneChange = (timezone: string) => {
    updateFormData('schedule', { timezone });
  };

  const isComplete = !!formData.schedule.startDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Schedule & Timing</h3>
          <p className="text-sm text-muted-foreground">
            Set when your campaign should run
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={formData.schedule.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            End Date (Optional)
          </Label>
          <Input
            id="end-date"
            type="date"
            value={formData.schedule.endDate || ''}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={formData.schedule.startDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timezone
        </Label>
        <Select
          value={formData.schedule.timezone}
          onValueChange={handleTimezoneChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Europe/London">London (GMT)</SelectItem>
            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 