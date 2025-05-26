import React, { forwardRef, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useAnnouncement, generateId } from '@/lib/accessibility';

interface AccessibleButtonProps extends ButtonProps {
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Description for complex buttons */
  ariaDescription?: string;
  /** Loading state with announcement */
  isLoading?: boolean;
  /** Loading text for screen readers */
  loadingText?: string;
  /** Success state with announcement */
  isSuccess?: boolean;
  /** Success text for screen readers */
  successText?: string;
  /** Error state with announcement */
  isError?: boolean;
  /** Error text for screen readers */
  errorText?: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Announce state changes to screen readers */
  announceStateChanges?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    ariaLabel,
    ariaDescription,
    isLoading = false,
    loadingText = 'Loading',
    isSuccess = false,
    successText = 'Success',
    isError = false,
    errorText = 'Error',
    shortcut,
    announceStateChanges = true,
    className,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const [buttonId] = useState(() => generateId('accessible-button'));
    const [descriptionId] = useState(() => generateId('button-description'));
    const { announcement, announce } = useAnnouncement();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (announceStateChanges) {
        if (isLoading) {
          announce(loadingText, 'assertive');
        } else if (isSuccess) {
          announce(successText, 'polite');
        } else if (isError) {
          announce(errorText, 'assertive');
        }
      }
      
      onClick?.(event);
    };

    const getButtonState = () => {
      if (isLoading) return 'loading';
      if (isSuccess) return 'success';
      if (isError) return 'error';
      return 'default';
    };

    const getStateIcon = () => {
      if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
      }
      return null;
    };

    const getStateText = () => {
      if (isLoading) return loadingText;
      if (isSuccess) return successText;
      if (isError) return errorText;
      return children;
    };

    const buttonState = getButtonState();
    const stateIcon = getStateIcon();
    const displayText = getStateText();

    return (
      <>
        <Button
          ref={ref}
          id={buttonId}
          className={cn(
            // Base styles
            'relative transition-all duration-200',
            // State-specific styles
            {
              'bg-green-600 hover:bg-green-700 text-white': isSuccess,
              'bg-red-600 hover:bg-red-700 text-white': isError,
              'cursor-not-allowed opacity-50': isLoading,
            },
            className
          )}
          disabled={disabled || isLoading}
          onClick={handleClick}
          aria-label={ariaLabel}
          aria-describedby={ariaDescription ? descriptionId : undefined}
          aria-busy={isLoading}
          aria-live={announceStateChanges ? 'polite' : undefined}
          data-state={buttonState}
          {...props}
        >
          <span className="flex items-center gap-2">
            {stateIcon}
            <span>{displayText}</span>
            {shortcut && (
              <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-xs bg-muted rounded border">
                {shortcut}
              </kbd>
            )}
          </span>
        </Button>

        {/* Hidden description for screen readers */}
        {ariaDescription && (
          <span id={descriptionId} className="sr-only">
            {ariaDescription}
          </span>
        )}

        {/* Live region for announcements */}
        {announcement && (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {announcement}
          </div>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Specialized button variants
export const AccessibleSubmitButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (props, ref) => (
    <AccessibleButton
      ref={ref}
      type="submit"
      ariaLabel="Submit form"
      loadingText="Submitting form"
      successText="Form submitted successfully"
      errorText="Form submission failed"
      {...props}
    />
  )
);

AccessibleSubmitButton.displayName = 'AccessibleSubmitButton';

export const AccessibleCancelButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (props, ref) => (
    <AccessibleButton
      ref={ref}
      variant="outline"
      ariaLabel="Cancel action"
      {...props}
    />
  )
);

AccessibleCancelButton.displayName = 'AccessibleCancelButton';

export const AccessibleDeleteButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (props, ref) => (
    <AccessibleButton
      ref={ref}
      variant="destructive"
      ariaLabel="Delete item"
      ariaDescription="This action cannot be undone"
      loadingText="Deleting item"
      successText="Item deleted successfully"
      errorText="Failed to delete item"
      {...props}
    />
  )
);

AccessibleDeleteButton.displayName = 'AccessibleDeleteButton'; 