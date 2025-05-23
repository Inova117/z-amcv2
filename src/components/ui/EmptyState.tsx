
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ title, description, icon = '📝', action }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-96">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-4xl mb-4">{icon}</div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          {action && (
            <Button onClick={action.onClick} className="w-full">
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
