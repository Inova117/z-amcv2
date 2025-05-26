import React from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle 
} from 'lucide-react';

export const NotificationDemo = () => {
  const { addNotification } = useNotificationStore();

  const createSystemNotification = () => {
    addNotification({
      type: 'system',
      title: 'System Update Available',
      message: 'A new version of ZAMC is available with improved performance and new features.',
      priority: 'medium',
      read: false,
      actionUrl: '/settings',
      actionLabel: 'Learn More',
      metadata: { version: '2.1.0', updateType: 'feature' },
    });
  };

  const createCampaignAlert = () => {
    addNotification({
      type: 'campaign',
      title: 'Budget Alert: Holiday Campaign',
      message: 'Your campaign has spent 85% of its daily budget. Consider adjusting bid strategies.',
      priority: 'high',
      read: false,
      actionUrl: '/campaigns/holiday-2024/analytics',
      actionLabel: 'View Campaign',
      metadata: { 
        campaignId: 'holiday-2024', 
        budgetUsed: 0.85, 
        alertType: 'budget_warning' 
      },
    });
  };

  const createAIRecommendation = () => {
    addNotification({
      type: 'ai_recommendation',
      title: 'Optimization Opportunity Detected',
      message: 'AI analysis suggests reallocating 15% of your search budget to video ads could increase ROAS by 12%.',
      priority: 'medium',
      read: false,
      actionUrl: '/campaigns/optimization',
      actionLabel: 'Apply Suggestion',
      metadata: { 
        confidence: 0.87, 
        impact: 'medium', 
        category: 'budget_optimization',
        expectedROASIncrease: 0.12 
      },
    });
  };

  const createAssetApproval = () => {
    addNotification({
      type: 'asset_approval',
      title: 'Asset Requires Review',
      message: 'Your new product video "Winter Collection 2024" is pending approval from the creative team.',
      priority: 'low',
      read: false,
      actionUrl: '/assets/winter-collection-video',
      actionLabel: 'View Asset',
      metadata: { 
        assetId: 'winter-collection-video', 
        assetType: 'video', 
        submittedBy: 'demo-user' 
      },
    });
  };

  const createChatMention = () => {
    addNotification({
      type: 'chat_mention',
      title: 'New mention in Q4 Strategy',
      message: '@sarah.marketing mentioned you: "Can you review the latest performance metrics?"',
      priority: 'medium',
      read: false,
      actionUrl: '/board/q4-strategy',
      actionLabel: 'Join Discussion',
      metadata: { 
        boardId: 'q4-strategy', 
        messageId: 'msg_123', 
        mentionedBy: 'sarah.marketing' 
      },
    });
  };

  const createUrgentAlert = () => {
    addNotification({
      type: 'campaign',
      title: 'URGENT: Campaign Suspended',
      message: 'Your "Black Friday Sale" campaign has been suspended due to policy violations. Immediate action required.',
      priority: 'urgent',
      read: false,
      actionUrl: '/campaigns/black-friday/issues',
      actionLabel: 'Resolve Issues',
      metadata: { 
        campaignId: 'black-friday', 
        suspensionReason: 'policy_violation',
        issueType: 'content_policy' 
      },
    });
  };

  const notificationTypes = [
    {
      name: 'System Update',
      description: 'General system notifications and announcements',
      icon: Bell,
      color: 'bg-blue-100 text-blue-600',
      action: createSystemNotification,
    },
    {
      name: 'Campaign Alert',
      description: 'Budget warnings and performance alerts',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      action: createCampaignAlert,
    },
    {
      name: 'AI Recommendation',
      description: 'Smart optimization suggestions',
      icon: Lightbulb,
      color: 'bg-purple-100 text-purple-600',
      action: createAIRecommendation,
    },
    {
      name: 'Asset Approval',
      description: 'Creative asset review notifications',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      action: createAssetApproval,
    },
    {
      name: 'Chat Mention',
      description: 'Team collaboration mentions',
      icon: MessageSquare,
      color: 'bg-indigo-100 text-indigo-600',
      action: createChatMention,
    },
    {
      name: 'Urgent Alert',
      description: 'Critical issues requiring immediate attention',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      action: createUrgentAlert,
    },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification System Demo
        </CardTitle>
        <CardDescription>
          Test different types of notifications to see how they appear in the notification center.
          Click the bell icon in the top navigation to view notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            
            return (
              <Card key={type.name} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${type.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{type.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {type.description}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={type.action}
                      className="w-full"
                    >
                      Create Notification
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">How to Test:</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Click any "Create Notification" button above</li>
            <li>2. Look for the bell icon in the top navigation bar</li>
            <li>3. Notice the red badge showing unread count</li>
            <li>4. Click the bell to open the notification center</li>
            <li>5. Test filtering, marking as read, and taking actions</li>
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">Real-time Updates</Badge>
          <Badge variant="outline">GraphQL Subscriptions</Badge>
          <Badge variant="outline">Priority Filtering</Badge>
          <Badge variant="outline">Action Buttons</Badge>
          <Badge variant="outline">Auto-expiration</Badge>
        </div>
      </CardContent>
    </Card>
  );
}; 