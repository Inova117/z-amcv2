import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  FolderOpen,
  Inbox,
  Users,
  BarChart3,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string | React.ComponentType<any>;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ComponentType<any>;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ComponentType<any>;
  };
  size?: 'sm' | 'md' | 'lg';
  layout?: 'centered' | 'inline' | 'card';
  className?: string;
  showBorder?: boolean;
  suggestions?: string[];
}

const PRESET_ICONS = {
  folder: FolderOpen,
  inbox: Inbox,
  users: Users,
  analytics: BarChart3,
  settings: Settings,
  search: Search,
  upload: Upload,
  filter: Filter,
  plus: Plus,
  zap: Zap,
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon = '📝', 
  action,
  secondaryAction,
  size = 'md',
  layout = 'centered',
  className,
  showBorder = true,
  suggestions = []
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const renderIcon = () => {
    if (typeof icon === 'string') {
      if (icon in PRESET_ICONS) {
        const IconComponent = PRESET_ICONS[icon as keyof typeof PRESET_ICONS];
        return <IconComponent className={cn(iconSizes[size], 'text-gray-400')} />;
      }
      return <div className="text-4xl mb-4">{icon}</div>;
    }
    
    if (React.isValidElement(icon) || typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<any>;
      return <IconComponent className={cn(iconSizes[size], 'text-gray-400')} />;
    }
    
    return <div className="text-4xl mb-4">{icon}</div>;
  };

  const content = (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        {renderIcon()}
      </div>
      
      <div className="space-y-2">
        <h3 className={cn(
          'font-semibold text-gray-900',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}>
          {title}
        </h3>
        <p className={cn(
          'text-gray-600',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Try these suggestions:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button 
              onClick={action.onClick} 
              variant={action.variant || 'default'}
              className="flex items-center gap-2"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick} 
              variant={secondaryAction.variant || 'outline'}
              className="flex items-center gap-2"
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (layout === 'inline') {
    return (
      <div className={cn('py-12 px-4', className)}>
        <div className={cn('mx-auto', sizeClasses[size])}>
          {content}
        </div>
      </div>
    );
  }

  if (layout === 'card') {
    return (
      <div className={cn('flex items-center justify-center min-h-96 p-4', className)}>
        <Card className={cn('w-full', sizeClasses[size], !showBorder && 'border-0 shadow-none')}>
          <CardContent className="p-8">
            {content}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default centered layout
  return (
    <div className={cn('flex items-center justify-center min-h-96 p-4', className)}>
      <div className={cn('w-full', sizeClasses[size])}>
        {content}
      </div>
    </div>
  );
};

// Preset empty states for common scenarios
interface NoDataProps {
  resource: string;
  onCreateNew?: () => void;
  onImport?: () => void;
}

export const NoData: React.FC<NoDataProps> = ({ resource, onCreateNew, onImport }) => {
  return (
    <EmptyState
      icon="folder"
      title={`No ${resource} yet`}
      description={`You haven't created any ${resource.toLowerCase()} yet. Get started by creating your first one.`}
      action={onCreateNew ? {
        label: `Create ${resource}`,
        onClick: onCreateNew,
        icon: Plus,
      } : undefined}
      secondaryAction={onImport ? {
        label: 'Import',
        onClick: onImport,
        variant: 'outline',
        icon: Upload,
      } : undefined}
      suggestions={[
        'Start with a template',
        'Import existing data',
        'Follow the quick setup guide'
      ]}
    />
  );
};

interface NoSearchResultsProps {
  query: string;
  onClearSearch?: () => void;
  onAdjustFilters?: () => void;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({ 
  query, 
  onClearSearch, 
  onAdjustFilters 
}) => {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search or filters.`}
      action={onClearSearch ? {
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline',
      } : undefined}
      secondaryAction={onAdjustFilters ? {
        label: 'Adjust Filters',
        onClick: onAdjustFilters,
        variant: 'outline',
        icon: Filter,
      } : undefined}
      suggestions={[
        'Check spelling',
        'Use fewer keywords',
        'Try different terms',
        'Clear all filters'
      ]}
      size="sm"
    />
  );
};

interface NoPermissionProps {
  resource: string;
  onRequestAccess?: () => void;
  onGoBack?: () => void;
}

export const NoPermission: React.FC<NoPermissionProps> = ({ 
  resource, 
  onRequestAccess, 
  onGoBack 
}) => {
  return (
    <EmptyState
      icon="🔒"
      title="Access Restricted"
      description={`You don't have permission to view ${resource}. Contact your administrator for access.`}
      action={onRequestAccess ? {
        label: 'Request Access',
        onClick: onRequestAccess,
      } : undefined}
      secondaryAction={onGoBack ? {
        label: 'Go Back',
        onClick: onGoBack,
        variant: 'outline',
      } : undefined}
      size="md"
    />
  );
};

interface ComingSoonProps {
  feature: string;
  description?: string;
  onNotifyMe?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  feature, 
  description = "We're working hard to bring you this feature.",
  onNotifyMe 
}) => {
  return (
    <EmptyState
      icon="zap"
      title={`${feature} Coming Soon`}
      description={description}
      action={onNotifyMe ? {
        label: 'Notify Me',
        onClick: onNotifyMe,
        icon: ArrowRight,
      } : undefined}
      suggestions={[
        'Check back soon',
        'Follow our updates',
        'Join the beta program'
      ]}
      size="lg"
    />
  );
};

interface MaintenanceProps {
  title?: string;
  description?: string;
  estimatedTime?: string;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ 
  title = "Under Maintenance",
  description = "We're performing scheduled maintenance to improve your experience.",
  estimatedTime
}) => {
  return (
    <EmptyState
      icon="⚙️"
      title={title}
      description={`${description}${estimatedTime ? ` Estimated completion: ${estimatedTime}` : ''}`}
      suggestions={[
        'Check our status page',
        'Follow @zamcstatus for updates',
        'Try again in a few minutes'
      ]}
      size="lg"
      layout="centered"
    />
  );
};
