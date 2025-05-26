import React, { useState, useEffect } from 'react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Settings,
  AlertTriangle,
  Info,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  MoreVertical,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconMap = {
    system: Info,
    campaign: TrendingUp,
    ai_recommendation: Lightbulb,
    asset_approval: Check,
    chat_mention: MessageSquare,
  };
  
  const Icon = iconMap[type];
  return <Icon className="h-4 w-4" />;
};

const PriorityBadge = ({ priority }: { priority: Notification['priority'] }) => {
  const variants = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive',
  } as const;
  
  const colors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };
  
  return (
    <Badge variant={variants[priority]} className={cn('text-xs', colors[priority])}>
      {priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onRemove, 
  onAction 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onAction: (url: string) => void;
}) => {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      !notification.read && 'border-l-4 border-l-primary bg-primary/5'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              'p-2 rounded-full',
              notification.read ? 'bg-muted' : 'bg-primary/10'
            )}>
              <NotificationIcon type={notification.type} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'text-sm font-medium',
                  !notification.read && 'font-semibold'
                )}>
                  {notification.title}
                </h4>
                <PriorityBadge priority={notification.priority} />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.createdAt)}
                </span>
                
                {notification.actionUrl && notification.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction(notification.actionUrl!)}
                    className="h-7 text-xs"
                  >
                    {notification.actionLabel}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.read && (
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onRemove(notification.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    initialize 
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<Notification['priority'] | 'all'>('all');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredNotifications = notifications.filter(notification => {
    // Tab filter
    if (activeTab === 'unread' && notification.read) return false;
    if (activeTab !== 'all' && activeTab !== 'unread' && notification.type !== activeTab) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
    
    return true;
  });

  const handleAction = (url: string) => {
    navigate(url);
    setIsOpen(false);
  };

  const getTabCount = (tab: string) => {
    if (tab === 'unread') return unreadCount;
    if (tab === 'all') return notifications.length;
    return notifications.filter(n => n.type === tab).length;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} unread</Badge>
              )}
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                    All Priorities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                All ({getTabCount('all')})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread ({getTabCount('unread')})
              </TabsTrigger>
              <TabsTrigger value="ai_recommendation" className="text-xs">
                AI ({getTabCount('ai_recommendation')})
              </TabsTrigger>
              <TabsTrigger value="campaign" className="text-xs">
                Campaigns ({getTabCount('campaign')})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                {priorityFilter !== 'all' && ` (${priorityFilter} priority)`}
              </div>
              
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <X className="h-4 w-4 mr-2" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'unread' 
                        ? "You're all caught up! No unread notifications."
                        : "You don't have any notifications yet."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onRemove={removeNotification}
                        onAction={handleAction}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 