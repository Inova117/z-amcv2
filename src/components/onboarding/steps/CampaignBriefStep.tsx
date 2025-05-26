import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Target, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  ShoppingCart,
  Heart,
  Zap,
  Building,
  Lightbulb
} from 'lucide-react';

interface CampaignBriefData {
  objective: string;
  budget: number;
  targetAudience: string;
  industry: string;
  goals: string[];
  timeline: string;
}

interface CampaignBriefStepProps {
  data: CampaignBriefData;
  onUpdate: (data: Partial<CampaignBriefData>) => void;
}

const OBJECTIVES = [
  {
    id: 'brand_awareness',
    name: 'Brand Awareness',
    description: 'Increase visibility and recognition of your brand',
    icon: TrendingUp,
    color: 'bg-blue-500',
  },
  {
    id: 'lead_generation',
    name: 'Lead Generation',
    description: 'Capture potential customer information',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    id: 'sales',
    name: 'Drive Sales',
    description: 'Increase online or offline sales',
    icon: ShoppingCart,
    color: 'bg-purple-500',
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'Boost social media engagement and interactions',
    icon: Heart,
    color: 'bg-pink-500',
  },
  {
    id: 'traffic',
    name: 'Website Traffic',
    description: 'Drive more visitors to your website',
    icon: Zap,
    color: 'bg-orange-500',
  },
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Education', 'Real Estate',
  'Automotive', 'Travel', 'Food & Beverage', 'Fashion', 'Entertainment',
  'Professional Services', 'Manufacturing', 'Non-profit', 'Other'
];

const GOALS = [
  { id: 'increase_sales', label: 'Increase Sales Revenue' },
  { id: 'generate_leads', label: 'Generate Quality Leads' },
  { id: 'brand_awareness', label: 'Build Brand Awareness' },
  { id: 'customer_acquisition', label: 'Acquire New Customers' },
  { id: 'customer_retention', label: 'Retain Existing Customers' },
  { id: 'market_expansion', label: 'Expand to New Markets' },
  { id: 'product_launch', label: 'Launch New Product/Service' },
  { id: 'competitive_advantage', label: 'Gain Competitive Advantage' },
  { id: 'thought_leadership', label: 'Establish Thought Leadership' },
  { id: 'community_building', label: 'Build Community' },
];

const TIMELINES = [
  { value: '7', label: '1 Week - Quick Test' },
  { value: '14', label: '2 Weeks - Short Campaign' },
  { value: '30', label: '1 Month - Standard Campaign' },
  { value: '60', label: '2 Months - Extended Campaign' },
  { value: '90', label: '3 Months - Long-term Campaign' },
  { value: 'ongoing', label: 'Ongoing - Continuous Campaign' },
];

export const CampaignBriefStep: React.FC<CampaignBriefStepProps> = ({ data, onUpdate }) => {
  const handleGoalToggle = (goalId: string) => {
    const isSelected = data.goals.includes(goalId);
    const newGoals = isSelected
      ? data.goals.filter(id => id !== goalId)
      : [...data.goals, goalId];
    
    onUpdate({ goals: newGoals });
  };

  const formatBudget = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-2">Tell us about your campaign goals</h3>
        <p className="text-gray-600">
          This helps our AI create the perfect campaign strategy for your business
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Objective */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Primary Campaign Objective *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {OBJECTIVES.map((objective) => {
                const Icon = objective.icon;
                const isSelected = data.objective === objective.id;
                
                return (
                  <div
                    key={objective.id}
                    onClick={() => onUpdate({ objective: objective.id })}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
                      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${objective.color} flex items-center justify-center text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="font-medium">{objective.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{objective.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Monthly Budget *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Budget Amount: {formatBudget(data.budget)}</Label>
              <Slider
                value={[data.budget]}
                onValueChange={(value) => onUpdate({ budget: value[0] })}
                max={10000}
                min={100}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$100</span>
                <span>$10,000+</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget-input">Or enter exact amount:</Label>
              <Input
                id="budget-input"
                type="number"
                value={data.budget}
                onChange={(e) => onUpdate({ budget: parseInt(e.target.value) || 0 })}
                placeholder="Enter budget amount"
                min="100"
                max="100000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Industry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Industry *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={data.industry} onValueChange={(value) => onUpdate({ industry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase().replace(/\s+/g, '_')}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Target Audience *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.targetAudience}
              onChange={(e) => onUpdate({ targetAudience: e.target.value })}
              placeholder="Describe your ideal customer (e.g., 'Small business owners aged 25-45 interested in productivity tools and automation')"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about demographics, interests, behaviors, and pain points
            </p>
          </CardContent>
        </Card>

        {/* Campaign Goals */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Campaign Goals * (Select all that apply)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {GOALS.map((goal) => (
                <div key={goal.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal.id}
                    checked={data.goals.includes(goal.id)}
                    onCheckedChange={() => handleGoalToggle(goal.id)}
                  />
                  <label
                    htmlFor={goal.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {goal.label}
                  </label>
                </div>
              ))}
            </div>
            
            {data.goals.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Selected Goals:</p>
                <div className="flex flex-wrap gap-2">
                  {data.goals.map((goalId) => {
                    const goal = GOALS.find(g => g.id === goalId);
                    return (
                      <Badge key={goalId} variant="secondary">
                        {goal?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Campaign Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={data.timeline} onValueChange={(value) => onUpdate({ timeline: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign duration" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINES.map((timeline) => (
                  <SelectItem key={timeline.value} value={timeline.value}>
                    {timeline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Preview */}
      {data.objective && data.industry && data.targetAudience && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="h-5 w-5" />
              AI Campaign Insights Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Recommended Strategy</p>
                  <p className="text-sm text-blue-700">
                    Based on your {data.industry} industry and {data.objective.replace('_', ' ')} objective, 
                    we recommend a multi-platform approach focusing on {data.targetAudience.split(' ').slice(0, 5).join(' ')}...
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Budget Allocation</p>
                  <p className="text-sm text-green-700">
                    Your {formatBudget(data.budget)} monthly budget will be optimized across platforms 
                    for maximum {data.objective.replace('_', ' ')} impact.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-full p-1">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Timeline Optimization</p>
                  <p className="text-sm text-purple-700">
                    {data.timeline === 'ongoing' 
                      ? 'Continuous optimization will improve performance over time'
                      : `${data.timeline} days provides sufficient time for testing and optimization`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Lightbulb className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">💡 Pro Tips</h4>
            <ul className="text-sm text-gray-700 mt-1 space-y-1">
              <li>• Be specific about your target audience for better AI recommendations</li>
              <li>• Multiple goals help create comprehensive campaign strategies</li>
              <li>• Higher budgets allow for more platform testing and optimization</li>
              <li>• Longer timelines provide better data for AI learning and optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 