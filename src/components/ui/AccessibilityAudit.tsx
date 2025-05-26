import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { 
  runAccessibilityAudit, 
  AccessibilityIssue,
  useReducedMotion,
  useHighContrast 
} from '@/lib/accessibility';

interface AccessibilityAuditProps {
  container?: HTMLElement;
  autoRun?: boolean;
}

export const AccessibilityAudit: React.FC<AccessibilityAuditProps> = ({ 
  container, 
  autoRun = false 
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const auditContainer = container || document.body;
      const foundIssues = runAccessibilityAudit(auditContainer);
      setIssues(foundIssues);
      setLastRun(new Date());
    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      runAudit();
    }
  }, [autoRun]);

  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, AccessibilityIssue[]>);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'serious':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'moderate':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'minor':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'serious':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'minor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const totalIssues = issues.length;
  const criticalIssues = groupedIssues.critical?.length || 0;
  const seriousIssues = groupedIssues.serious?.length || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Accessibility Audit</span>
              {totalIssues === 0 && lastRun && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              WCAG 2.1 AA compliance check
              {lastRun && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Last run: {lastRun.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            onClick={runAudit} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? 'Running...' : 'Run Audit'}
          </Button>
        </div>
        
        {/* User Preferences Display */}
        <div className="flex gap-2 mt-4">
          {prefersReducedMotion && (
            <Badge variant="outline" className="text-xs">
              Reduced Motion
            </Badge>
          )}
          {prefersHighContrast && (
            <Badge variant="outline" className="text-xs">
              High Contrast
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {totalIssues === 0 && lastRun ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700">
              No Accessibility Issues Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Your application meets WCAG 2.1 AA standards
            </p>
          </div>
        ) : totalIssues > 0 ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
                <div className="text-xs text-red-600">Critical</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{seriousIssues}</div>
                <div className="text-xs text-orange-600">Serious</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {groupedIssues.moderate?.length || 0}
                </div>
                <div className="text-xs text-yellow-600">Moderate</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {groupedIssues.minor?.length || 0}
                </div>
                <div className="text-xs text-blue-600">Minor</div>
              </div>
            </div>

            {/* Issues by Category */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({totalIssues})</TabsTrigger>
                <TabsTrigger value="critical">Critical ({criticalIssues})</TabsTrigger>
                <TabsTrigger value="serious">Serious ({seriousIssues})</TabsTrigger>
                <TabsTrigger value="moderate">Moderate ({groupedIssues.moderate?.length || 0})</TabsTrigger>
                <TabsTrigger value="minor">Minor ({groupedIssues.minor?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-2">
                {issues.map((issue, index) => (
                  <IssueCard key={index} issue={issue} />
                ))}
              </TabsContent>

              {Object.entries(groupedIssues).map(([severity, severityIssues]) => (
                <TabsContent key={severity} value={severity} className="space-y-2">
                  {severityIssues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Ready to Audit</h3>
            <p className="text-sm text-muted-foreground">
              Click "Run Audit" to check for accessibility issues
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const IssueCard: React.FC<{ issue: AccessibilityIssue }> = ({ issue }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'serious':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'moderate':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'minor':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'serious':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'minor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const highlightElement = () => {
    if (issue.element) {
      issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      issue.element.style.outline = '3px solid red';
      issue.element.style.outlineOffset = '2px';
      
      setTimeout(() => {
        issue.element!.style.outline = '';
        issue.element!.style.outlineOffset = '';
      }, 3000);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {getSeverityIcon(issue.severity)}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs">
              {issue.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {issue.rule}
            </Badge>
          </div>
          <p className="text-sm font-medium">{issue.message}</p>
          {issue.element && (
            <Button
              variant="outline"
              size="sm"
              onClick={highlightElement}
              className="text-xs"
            >
              Highlight Element
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {children}
    </a>
  );
};

// Live Region Component
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className = 'sr-only' }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
}; 