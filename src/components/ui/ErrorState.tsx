
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ 
  title = 'Something went wrong', 
  message, 
  onRetry 
}: ErrorStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-96">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
