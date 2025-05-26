import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, User, Building, Globe, Clock } from 'lucide-react';

interface AccountInfoData {
  name: string;
  title: string;
  company: string;
  timezone: string;
  language: string;
  avatar?: string;
}

interface AccountInfoStepProps {
  data: AccountInfoData;
  onUpdate: (data: Partial<AccountInfoData>) => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

export const AccountInfoStep: React.FC<AccountInfoStepProps> = ({ data, onUpdate }) => {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create object URL for preview
    const avatarUrl = URL.createObjectURL(file);
    onUpdate({ avatar: avatarUrl });
    
    setIsUploadingAvatar(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-2">Tell us about yourself</h3>
        <p className="text-gray-600">
          This information helps us personalize your ZAMC experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Upload */}
        <div className="md:col-span-2 flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={data.avatar} />
              <AvatarFallback className="text-lg">
                {data.name ? getInitials(data.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2">
              <Button
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                disabled={isUploadingAvatar}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">Profile Photo</p>
            <p className="text-xs text-gray-500">
              {isUploadingAvatar ? 'Uploading...' : 'Click to upload'}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Personal Information</h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="e.g., Marketing Manager"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Company Information</h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={data.company}
                onChange={(e) => onUpdate({ company: e.target.value })}
                placeholder="Enter your company name"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Preferences</h4>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={data.timezone} onValueChange={(value) => onUpdate({ timezone: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {tz.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={data.language} onValueChange={(value) => onUpdate({ language: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Why do we need this information?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your profile helps us customize your dashboard, set appropriate defaults for your campaigns, 
              and ensure you receive notifications at the right time for your timezone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 