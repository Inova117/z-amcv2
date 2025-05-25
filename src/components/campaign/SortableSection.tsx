import React from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { CampaignBuilderSection } from '@/types/campaign';
import { cn } from '@/lib/utils';

interface SortableSectionProps {
  section: CampaignBuilderSection;
  children: React.ReactNode;
  isDragDisabled?: boolean;
}

export const SortableSection: React.FC<SortableSectionProps> = ({
  section,
  children,
  isDragDisabled = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSectionIcon = () => {
    if (section.completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (section.required) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />;
  };

  const getSectionStatus = () => {
    if (section.completed) {
      return (
        <Badge variant="default" className="bg-green-600">
          Complete
        </Badge>
      );
    }
    if (section.required) {
      return (
        <Badge variant="destructive">
          Required
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Optional
      </Badge>
    );
  };

  if (!isVisible) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="p-1"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {section.title} (Hidden)
              </span>
            </div>
            {getSectionStatus()}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 shadow-lg scale-105",
        section.completed && "border-green-200 bg-green-50/50",
        !section.completed && section.required && "border-orange-200 bg-orange-50/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isDragDisabled && (
              <Button
                variant="ghost"
                size="sm"
                className="cursor-grab active:cursor-grabbing p-1"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            
            {getSectionIcon()}
            
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {section.title}
                <span className="text-sm font-normal text-muted-foreground">
                  #{section.order}
                </span>
              </CardTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getSectionStatus()}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-1"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}; 