import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  url: string;
  lastCheck: string;
  responseTime?: number;
  details?: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  timestamp: string;
  version: string;
}

const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const services = [
    { name: 'BFF GraphQL API', url: '/health', port: 4000 },
    { name: 'Orchestrator Service', url: '/health', port: 8001 },
    { name: 'Connectors Service', url: '/health', port: 8002 },
    { name: 'Campaign Performance', url: '/campaign-performance/health', port: 8001 },
  ];

  const checkServiceHealth = async (service: { name: string; url: string; port: number }): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://localhost:${service.port}${service.url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      return {
        name: service.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        url: `http://localhost:${service.port}${service.url}`,
        lastCheck: new Date().toISOString(),
        responseTime,
        details: data,
      };
    } catch (err) {
      return {
        name: service.name,
        status: 'unhealthy',
        url: `http://localhost:${service.port}${service.url}`,
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: { error: err instanceof Error ? err.message : 'Unknown error' },
      };
    }
  };

  const checkAllServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const serviceChecks = await Promise.all(
        services.map(service => checkServiceHealth(service))
      );

      const healthyCount = serviceChecks.filter(s => s.status === 'healthy').length;
      const totalCount = serviceChecks.length;

      let overall: 'healthy' | 'unhealthy' | 'degraded';
      if (healthyCount === totalCount) {
        overall = 'healthy';
      } else if (healthyCount === 0) {
        overall = 'unhealthy';
      } else {
        overall = 'degraded';
      }

      setHealth({
        overall,
        services: serviceChecks,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check service health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAllServices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      unhealthy: 'destructive',
      degraded: 'secondary',
      unknown: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading && !health) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking System Health...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Health Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={checkAllServices} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health?.overall || 'unknown')}
              System Health Status
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(health?.overall || 'unknown')}
              <Button
                onClick={checkAllServices}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Last Check:</span>
              <p className="text-muted-foreground">
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <span className="font-medium">Version:</span>
              <p className="text-muted-foreground">{health?.version || 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium">Services:</span>
              <p className="text-muted-foreground">
                {health?.services.filter(s => s.status === 'healthy').length || 0} / {health?.services.length || 0} Healthy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {health?.services.map((service, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  {service.name}
                </div>
                {getStatusBadge(service.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Response Time:</span>
                  <p className="text-muted-foreground">
                    {service.responseTime ? `${service.responseTime}ms` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Last Check:</span>
                  <p className="text-muted-foreground">
                    {new Date(service.lastCheck).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-sm">Endpoint:</span>
                <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                  {service.url}
                </p>
              </div>

              {service.details && (
                <div>
                  <span className="font-medium text-sm">Details:</span>
                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(service.details, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      {health?.services.some(s => s.responseTime) && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Average Response Time:</span>
                <p className="text-muted-foreground">
                  {Math.round(
                    health.services
                      .filter(s => s.responseTime)
                      .reduce((sum, s) => sum + (s.responseTime || 0), 0) /
                    health.services.filter(s => s.responseTime).length
                  )}ms
                </p>
              </div>
              <div>
                <span className="font-medium">Fastest Service:</span>
                <p className="text-muted-foreground">
                  {health.services
                    .filter(s => s.responseTime)
                    .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))[0]?.name || 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium">Slowest Service:</span>
                <p className="text-muted-foreground">
                  {health.services
                    .filter(s => s.responseTime)
                    .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))[0]?.name || 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium">Uptime:</span>
                <p className="text-muted-foreground">
                  {Math.round((health.services.filter(s => s.status === 'healthy').length / health.services.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthCheck; 