import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  AlertCircle, 
  X, 
  CheckCircle,
  Info
} from 'lucide-react';
import { ValidationError } from '@/types/campaign';

interface ValidationPanelProps {
  errors: ValidationError[];
  onClearErrors: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  errors,
  onClearErrors,
}) => {
  const errorMessages = errors.filter(e => e.severity === 'error');
  const warningMessages = errors.filter(e => e.severity === 'warning');

  if (errors.length === 0) {
    return null;
  }

  const getFieldDisplayName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'basic.name': 'Campaign Name',
      'basic.description': 'Campaign Description',
      'basic.objective': 'Campaign Objective',
      'budget.amount': 'Budget Amount',
      'budget.currency': 'Budget Currency',
      'budget.bidStrategy': 'Bid Strategy',
      'platforms': 'Platform Selection',
      'targeting.demographics.locations': 'Target Locations',
      'targeting.interests': 'Target Interests',
      'creatives': 'Ad Creatives',
      'schedule.startDate': 'Start Date',
      'schedule.endDate': 'End Date',
    };
    
    return fieldMap[field] || field.split('.').pop() || field;
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Validation Issues
          </CardTitle>
          <div className="flex items-center gap-2">
            {errorMessages.length > 0 && (
              <Badge variant="destructive">
                {errorMessages.length} Error{errorMessages.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {warningMessages.length > 0 && (
              <Badge variant="secondary">
                {warningMessages.length} Warning{warningMessages.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearErrors}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Errors */}
        {errorMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Errors (Must Fix)
            </h4>
            <div className="space-y-2">
              {errorMessages.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {getFieldDisplayName(error.field)}:
                      </span>{' '}
                      {error.message}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-red-600 hover:text-red-800"
                      onClick={() => {
                        // Scroll to field or focus on it
                        const element = document.querySelector(`[data-field="${error.field}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      Fix
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {errorMessages.length > 0 && warningMessages.length > 0 && (
          <Separator />
        )}

        {/* Warnings */}
        {warningMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings (Recommended)
            </h4>
            <div className="space-y-2">
              {warningMessages.map((warning, index) => (
                <Alert key={index} className="border-orange-200 bg-orange-50">
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {getFieldDisplayName(warning.field)}:
                      </span>{' '}
                      {warning.message}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-orange-600 hover:text-orange-800"
                      onClick={() => {
                        // Scroll to field or focus on it
                        const element = document.querySelector(`[data-field="${warning.field}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      Review
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {errorMessages.length > 0 
                ? `${errorMessages.length} issue${errorMessages.length !== 1 ? 's' : ''} must be fixed before launch`
                : 'All critical issues resolved'
              }
            </span>
            {errorMessages.length === 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to proceed</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 