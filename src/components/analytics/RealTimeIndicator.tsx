import React from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export const RealTimeIndicator: React.FC = () => {
  const { 
    isRealTimeEnabled, 
    lastUpdated, 
    updateInterval 
  } = useAnalyticsStore();

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return updated.toLocaleTimeString();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isRealTimeEnabled ? "default" : "secondary"}
        className="flex items-center gap-1"
      >
        {isRealTimeEnabled ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Wifi className="h-3 w-3" />
            Live
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Paused
          </>
        )}
      </Badge>
      
      {lastUpdated && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {formatLastUpdated(lastUpdated)}
        </div>
      )}
      
      {isRealTimeEnabled && (
        <div className="text-xs text-muted-foreground">
          Updates every {updateInterval / 1000}s
        </div>
      )}
    </div>
  );
}; 