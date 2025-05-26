import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: 'primary' | 'secondary' | 'muted';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  variant = 'spinner',
  color = 'primary',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    muted: 'border-gray-100 border-t-gray-400',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-blue-600 animate-pulse',
              size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full bg-blue-600 animate-pulse',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 animate-pulse',
              size === 'sm' ? 'h-4 w-1' : size === 'md' ? 'h-6 w-1' : 'h-8 w-1'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.2s',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

interface LoadingPageProps {
  title?: string;
  description?: string;
  variant?: 'spinner' | 'skeleton';
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = 'Loading...',
  description = 'Please wait while we load your content',
  variant = 'spinner',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="min-h-screen p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <LoadingSpinner size="xl" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 max-w-md">{description}</p>
        </div>
        <div className="flex justify-center">
          <LoadingSpinner variant="dots" />
        </div>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'Loading...',
  size = 'sm',
}) => {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      <span className={cn('text-sm', size === 'md' && 'text-base')}>{text}</span>
    </div>
  );
};

interface RefreshLoadingProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

export const RefreshLoading: React.FC<RefreshLoadingProps> = ({
  isRefreshing,
  onRefresh,
  children,
}) => {
  return (
    <div className="relative">
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
