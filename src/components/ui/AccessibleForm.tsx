import React, { forwardRef, useState, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getFormFieldProps, createAriaDescribedBy } from '@/lib/accessibility';

interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  description,
  required = false,
  className,
  children,
}) => {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        id={labelId}
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          error && 'text-red-600',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          <Info className="inline h-4 w-4 mr-1" aria-hidden="true" />
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-labelledby': labelId,
          'aria-describedby': createAriaDescribedBy([
            description ? descriptionId : '',
            error ? errorId : '',
          ]),
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required ? 'true' : undefined,
          className: cn(
            (children as React.ReactElement).props.className,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          ),
        })}
        
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  showValidation?: boolean;
  validationMessage?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    description,
    required = false,
    showValidation = false,
    validationMessage,
    className,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const isValid = showValidation && !error && hasValue;

    return (
      <FormField
        label={label}
        error={error}
        description={description}
        required={required}
        className={className}
      >
        <div className="relative">
          <Input
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'transition-all duration-200',
              isFocused && 'ring-2 ring-primary ring-offset-2',
              isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            {...props}
          />
          
          {isValid && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            </div>
          )}
        </div>
        
        {isValid && validationMessage && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {validationMessage}
          </p>
        )}
      </FormField>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({
    label,
    error,
    description,
    required = false,
    maxLength,
    showCharacterCount = false,
    className,
    value,
    onChange,
    ...props
  }, ref) => {
    const [charCount, setCharCount] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const isNearLimit = maxLength && charCount > maxLength * 0.8;
    const isOverLimit = maxLength && charCount > maxLength;

    return (
      <FormField
        label={label}
        error={error}
        description={description}
        required={required}
        className={className}
      >
        <div className="space-y-2">
          <Textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            className={cn(
              'min-h-[100px] resize-y',
              isOverLimit && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            {...props}
          />
          
          {showCharacterCount && maxLength && (
            <div className="flex justify-end">
              <span
                className={cn(
                  'text-xs',
                  isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
      </FormField>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

interface AccessibleSelectProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  error,
  description,
  required = false,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  className,
}) => {
  return (
    <FormField
      label={label}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

interface AccessibleCheckboxProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
  label,
  description,
  error,
  required = false,
  checked,
  onCheckedChange,
  className,
}) => {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start space-x-2">
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-labelledby={labelId}
          aria-describedby={createAriaDescribedBy([
            description ? descriptionId : '',
            error ? errorId : '',
          ])}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          className={cn(
            'mt-0.5',
            error && 'border-red-500 data-[state=checked]:bg-red-500'
          )}
        />
        <div className="space-y-1">
          <Label
            id={labelId}
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              error && 'text-red-600',
              required && 'after:content-["*"] after:ml-1 after:text-red-500'
            )}
          >
            {label}
          </Label>
          
          {description && (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1 ml-6"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleRadioGroupProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
  label,
  description,
  error,
  required = false,
  options,
  value,
  onValueChange,
  className,
}) => {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Label
          id={labelId}
          className={cn(
            'text-sm font-medium leading-none',
            error && 'text-red-600',
            required && 'after:content-["*"] after:ml-1 after:text-red-500'
          )}
        >
          {label}
        </Label>
        
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        aria-labelledby={labelId}
        aria-describedby={createAriaDescribedBy([
          description ? descriptionId : '',
          error ? errorId : '',
        ])}
        aria-invalid={error ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
        className="space-y-2"
      >
        {options.map((option) => {
          const optionId = `${fieldId}-${option.value}`;
          const optionDescId = `${optionId}-description`;
          
          return (
            <div key={option.value} className="flex items-start space-x-2">
              <RadioGroupItem
                value={option.value}
                id={optionId}
                disabled={option.disabled}
                aria-describedby={option.description ? optionDescId : undefined}
                className={cn(
                  'mt-0.5',
                  error && 'border-red-500 text-red-500'
                )}
              />
              <div className="space-y-1">
                <Label
                  htmlFor={optionId}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {option.label}
                </Label>
                
                {option.description && (
                  <p id={optionDescId} className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </RadioGroup>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}; 