import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Wifi, 
  WifiOff, 
  Server,
  Shield,
  Bug,
  Clock,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  type?: 'network' | 'server' | 'auth' | 'notfound' | 'timeout' | 'generic';
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  details?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Connection Problem',
    suggestion: 'Check your internet connection and try again.',
  },
  server: {
    icon: Server,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Server Error',
    suggestion: 'Our servers are experiencing issues. Please try again later.',
  },
  auth: {
    icon: Shield,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Authentication Error',
    suggestion: 'Please log in again to continue.',
  },
  notfound: {
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Not Found',
    suggestion: 'The page or resource you\'re looking for doesn\'t exist.',
  },
  timeout: {
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    title: 'Request Timeout',
    suggestion: 'The request took too long. Please try again.',
  },
  generic: {
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Something went wrong',
    suggestion: 'An unexpected error occurred.',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  type = 'generic',
  onRetry,
  onGoHome,
  showDetails = false,
  details,
  className,
  size = 'md'
}) => {
  const config = ERROR_CONFIGS[type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={cn('flex items-center justify-center min-h-96 p-4', className)}>
      <Card className={cn('w-full text-center', sizeClasses[size], config.bgColor, config.borderColor)}>
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className={cn('rounded-full p-3', config.bgColor)}>
              <Icon className={cn(iconSizes[size], config.color)} />
            </div>
          </div>
          
          <CardTitle className={cn('text-lg', config.color)}>
            {title || config.title}
          </CardTitle>
          
          <Badge variant="outline" className={cn('mx-auto w-fit', config.color)}>
            Error {type.toUpperCase()}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">{config.suggestion}</p>
          </div>

          {showDetails && details && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                {details}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {onGoHome && (
              <Button onClick={onGoHome} variant="default" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  isOnline?: boolean;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, isOnline = false }) => {
  return (
    <ErrorState
      type="network"
      message={isOnline ? "Unable to connect to our servers" : "You appear to be offline"}
      onRetry={onRetry}
      showDetails={true}
      details={`Network status: ${isOnline ? 'Online' : 'Offline'}\nTimestamp: ${new Date().toISOString()}`}
    />
  );
};

interface ServerErrorProps {
  statusCode?: number;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export const ServerError: React.FC<ServerErrorProps> = ({ 
  statusCode = 500, 
  onRetry, 
  onGoHome 
}) => {
  const getErrorMessage = (code: number) => {
    switch (code) {
      case 500:
        return "Internal server error occurred";
      case 502:
        return "Bad gateway - service temporarily unavailable";
      case 503:
        return "Service temporarily unavailable";
      case 504:
        return "Gateway timeout - request took too long";
      default:
        return `Server error (${code})`;
    }
  };

  return (
    <ErrorState
      type="server"
      title={`Server Error ${statusCode}`}
      message={getErrorMessage(statusCode)}
      onRetry={onRetry}
      onGoHome={onGoHome}
      showDetails={true}
      details={`Status Code: ${statusCode}\nTimestamp: ${new Date().toISOString()}\nIf this persists, please contact support.`}
    />
  );
};

interface NotFoundErrorProps {
  resource?: string;
  onGoHome?: () => void;
}

export const NotFoundError: React.FC<NotFoundErrorProps> = ({ 
  resource = "page", 
  onGoHome 
}) => {
  return (
    <ErrorState
      type="notfound"
      title="404 - Not Found"
      message={`The ${resource} you're looking for doesn't exist or has been moved.`}
      onGoHome={onGoHome}
      size="lg"
    />
  );
};

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'destructive' | 'warning';
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onDismiss,
  variant = 'destructive'
}) => {
  const variantClasses = {
    destructive: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={cn('flex items-center gap-2 p-3 rounded-lg border', variantClasses[variant])}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-auto p-1 hover:bg-transparent"
        >
          ×
        </Button>
      )}
    </div>
  );
};
