import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApprovalItem {
  id: string;
  type: 'campaign' | 'creative' | 'budget' | 'targeting';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  aiScore: number;
  aiRecommendations: string[];
  reviewer?: string;
  reviewDate?: string;
  comments?: string;
}

interface CampaignApprovalWorkflowProps {
  campaignId: string;
  onApprovalComplete?: () => void;
}

export const CampaignApprovalWorkflow: React.FC<CampaignApprovalWorkflowProps> = ({
  campaignId,
  onApprovalComplete,
}) => {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([
    {
      id: 'campaign-strategy',
      type: 'campaign',
      title: 'Campaign Strategy',
      description: 'Overall campaign objectives and platform selection',
      status: 'approved',
      aiScore: 92,
      aiRecommendations: [
        'Excellent multi-platform approach for maximum reach',
        'Budget allocation aligns well with campaign objectives',
        'Timeline allows for proper optimization cycles'
      ],
      reviewer: 'AI Reviewer',
      reviewDate: new Date().toISOString(),
      comments: 'Strategy looks solid with good platform coverage.',
    },
    {
      id: 'creative-assets',
      type: 'creative',
      title: 'Creative Assets',
      description: 'Ad creatives, images, videos, and copy',
      status: 'pending',
      aiScore: 87,
      aiRecommendations: [
        'Strong visual appeal with clear value proposition',
        'Consider A/B testing different CTA colors',
        'Video assets optimized for mobile viewing',
        'Copy length appropriate for each platform'
      ],
    },
    {
      id: 'budget-allocation',
      type: 'budget',
      title: 'Budget Allocation',
      description: 'Budget distribution across platforms and ad sets',
      status: 'needs_review',
      aiScore: 78,
      aiRecommendations: [
        'Consider increasing Google Ads budget by 15%',
        'Meta budget allocation looks optimal',
        'Reserve 20% for testing new audiences',
        'Daily budget caps prevent overspending'
      ],
    },
    {
      id: 'audience-targeting',
      type: 'targeting',
      title: 'Audience Targeting',
      description: 'Target demographics, interests, and behaviors',
      status: 'approved',
      aiScore: 95,
      aiRecommendations: [
        'Excellent audience segmentation strategy',
        'Lookalike audiences properly configured',
        'Geographic targeting optimized for performance',
        'Interest targeting shows high relevance scores'
      ],
      reviewer: 'AI Reviewer',
      reviewDate: new Date().toISOString(),
      comments: 'Outstanding targeting setup with high conversion potential.',
    },
  ]);

  const handleApprove = async (itemId: string) => {
    setApprovalItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: 'approved',
            reviewer: 'Demo User',
            reviewDate: new Date().toISOString(),
            comments: reviewComments[itemId] || 'Approved'
          }
        : item
    ));

    toast({
      title: "Item Approved",
      description: "The item has been approved and marked for deployment.",
    });
  };

  const handleReject = async (itemId: string) => {
    const comments = reviewComments[itemId];
    if (!comments) {
      toast({
        title: "Comments Required",
        description: "Please provide comments when rejecting an item.",
        variant: "destructive",
      });
      return;
    }

    setApprovalItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: 'rejected',
            reviewer: 'Demo User',
            reviewDate: new Date().toISOString(),
            comments
          }
        : item
    ));

    toast({
      title: "Item Rejected",
      description: "The item has been rejected and sent back for revision.",
      variant: "destructive",
    });
  };

  const handleRequestChanges = async (itemId: string) => {
    const comments = reviewComments[itemId];
    if (!comments) {
      toast({
        title: "Comments Required",
        description: "Please provide specific feedback for requested changes.",
        variant: "destructive",
      });
      return;
    }

    setApprovalItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: 'needs_review',
            reviewer: 'Demo User',
            reviewDate: new Date().toISOString(),
            comments
          }
        : item
    ));

    toast({
      title: "Changes Requested",
      description: "Feedback has been sent to the team for revisions.",
    });
  };

  const getStatusIcon = (status: ApprovalItem['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ApprovalItem['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: ApprovalItem['type']) => {
    switch (type) {
      case 'campaign':
        return <Target className="h-4 w-4" />;
      case 'creative':
        return <Eye className="h-4 w-4" />;
      case 'budget':
        return <DollarSign className="h-4 w-4" />;
      case 'targeting':
        return <Users className="h-4 w-4" />;
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const approvedCount = approvalItems.filter(item => item.status === 'approved').length;
  const totalCount = approvalItems.length;
  const approvalProgress = (approvedCount / totalCount) * 100;

  const allApproved = approvedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Campaign Approval Workflow
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Review and approve campaign components before deployment
              </p>
            </div>
            
            {allApproved && (
              <Button
                onClick={onApprovalComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Deploy Campaign
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Approval Progress</span>
              <span className="text-sm text-muted-foreground">
                {approvedCount} of {totalCount} approved
              </span>
            </div>
            <Progress value={approvalProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Approval Items */}
      <div className="grid gap-4">
        {approvalItems.map((item) => (
          <Card key={item.id} className={`transition-all ${selectedItem === item.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className={`font-semibold ${getAIScoreColor(item.aiScore)}`}>
                      {item.aiScore}%
                    </span>
                  </div>
                  {getStatusIcon(item.status)}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* AI Recommendations */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-purple-900">AI Recommendations</h4>
                </div>
                <ul className="space-y-1">
                  {item.aiRecommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Previous Review */}
              {item.reviewer && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Review by {item.reviewer}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.reviewDate!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{item.comments}</p>
                </div>
              )}

              {/* Review Actions */}
              {item.status === 'pending' || item.status === 'needs_review' ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add review comments..."
                    value={reviewComments[item.id] || ''}
                    onChange={(e) => setReviewComments(prev => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))}
                    rows={3}
                  />
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleApprove(item.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    
                    <Button
                      onClick={() => handleRequestChanges(item.id)}
                      variant="outline"
                      size="sm"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    
                    <Button
                      onClick={() => handleReject(item.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    This item has been {item.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                  >
                    {selectedItem === item.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {allApproved && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">All Items Approved!</h3>
                <p className="text-sm text-green-700">
                  Your campaign is ready for deployment across all platforms.
                </p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-green-700">Approval Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">88%</div>
                <div className="text-sm text-blue-700">Avg AI Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Ready</div>
                <div className="text-sm text-purple-700">For Launch</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 