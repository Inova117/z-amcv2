import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useCampaignStore } from '@/store/campaignStore';
import { useCampaignOperations } from '@/hooks/useCampaignOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Save, 
  Eye, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  GripVertical,
  Undo2,
  Redo2
} from 'lucide-react';
import { SortableSection } from './SortableSection';
import { CampaignBasicsSection } from './sections/CampaignBasicsSection';
import { PlatformSelectionSection } from './sections/PlatformSelectionSection';
import { BudgetSection } from './sections/BudgetSection';
import { TargetingSection } from './sections/TargetingSection';
import { CreativesSection } from './sections/CreativesSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { CampaignPreview } from './CampaignPreview';
import { ValidationPanel } from './ValidationPanel';
import { useToast } from '@/hooks/use-toast';

interface CampaignBuilderProps {
  campaignId?: string;
  onSave?: (campaign: any) => void;
  onPreview?: () => void;
  onLaunch?: () => void;
}

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({
  campaignId,
  onSave,
  onPreview,
  onLaunch,
}) => {
  const {
    formData,
    sections,
    validationErrors,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    currentCampaign,
    reorderSections,
    initializeForm,
    clearValidationErrors,
  } = useCampaignStore();

  const {
    createCampaign,
    updateCampaign,
    validateCampaign,
    getCampaignPreview,
  } = useCampaignOperations();

  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form data
  useEffect(() => {
    if (campaignId) {
      // Load existing campaign
      initializeForm(currentCampaign);
    } else {
      // Initialize new campaign
      initializeForm();
    }
  }, [campaignId, currentCampaign, initializeForm]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !currentCampaign) return;

    const autoSaveTimer = setTimeout(async () => {
      await handleSave(true);
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [formData, isDirty, autoSaveEnabled, currentCampaign]);

  // Real-time validation
  useEffect(() => {
    const validateTimer = setTimeout(async () => {
      if (isDirty) {
        await validateCampaign(formData);
      }
    }, 500);

    return () => clearTimeout(validateTimer);
  }, [formData, isDirty, validateCampaign]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((section) => section.id === active.id);
      const newIndex = sections.findIndex((section) => section.id === over?.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      reorderSections(newSections);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    try {
      if (currentCampaign) {
        await updateCampaign(currentCampaign.id, formData);
      } else {
        const newCampaign = await createCampaign(formData);
        if (onSave) onSave(newCampaign);
      }
      
      if (!isAutoSave) {
        // Show success toast for manual saves
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
      // Show error toast
    }
  };

  const handlePreview = async () => {
    await validateCampaign(formData);
    if (validationErrors.filter(e => e.severity === 'error').length === 0) {
      setShowPreview(true);
      if (onPreview) onPreview();
    }
  };

  const handleLaunch = async () => {
    await validateCampaign(formData);
    if (validationErrors.filter(e => e.severity === 'error').length === 0) {
      if (onLaunch) onLaunch();
    }
  };

  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.length;
  const completionPercentage = (completedSections / totalSections) * 100;

  const hasErrors = validationErrors.some(e => e.severity === 'error');
  const hasWarnings = validationErrors.some(e => e.severity === 'warning');

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'basic':
        return <CampaignBasicsSection />;
      case 'platforms':
        return <PlatformSelectionSection />;
      case 'budget':
        return <BudgetSection />;
      case 'targeting':
        return <TargetingSection />;
      case 'creatives':
        return <CreativesSection />;
      case 'schedule':
        return <ScheduleSection />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {currentCampaign ? 'Edit Campaign' : 'Create Campaign'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentCampaign 
              ? `Editing: ${currentCampaign.name}`
              : 'Build your multi-platform advertising campaign'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={hasErrors}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            onClick={handleLaunch}
            disabled={hasErrors || completionPercentage < 100}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Progress and Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Campaign Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedSections} of {totalSections} sections completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasErrors && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.filter(e => e.severity === 'error').length} Errors
                </Badge>
              )}
              {hasWarnings && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.filter(e => e.severity === 'warning').length} Warnings
                </Badge>
              )}
              {!hasErrors && !hasWarnings && completionPercentage === 100 && (
                <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ready to Launch
                </Badge>
              )}
            </div>
          </div>
          
          <Progress value={completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Validation Alerts */}
      {validationErrors.length > 0 && (
        <ValidationPanel 
          errors={validationErrors}
          onClearErrors={clearValidationErrors}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    isDragDisabled={sections.length <= 1}
                  >
                    {renderSection(section.type)}
                  </SortableSection>
                ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => getCampaignPreview(formData)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Get Estimates
              </Button>
              
              <Separator />
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled
              >
                <Redo2 className="h-4 w-4 mr-2" />
                Redo
              </Button>
            </CardContent>
          </Card>

          {/* Section Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {section.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {section.required && (
                          <Badge variant="outline">
                            Required
                          </Badge>
                        )}
                        {section.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <CampaignPreview
          formData={formData}
          onClose={() => setShowPreview(false)}
          onLaunch={handleLaunch}
        />
      )}
    </div>
  );
}; 