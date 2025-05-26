// Accessibility utilities for WCAG 2.1 AA compliance
import React, { useEffect, useRef, useState } from 'react';

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const meetsWCAGAA = (foreground: string, background: string, isLargeText = false): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

export const meetsWCAGAAA = (foreground: string, background: string, isLargeText = false): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
};

// Keyboard navigation utilities
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  handlers: Partial<Record<keyof typeof KEYBOARD_KEYS, () => void>>
) => {
  const key = event.key;
  const handler = Object.entries(KEYBOARD_KEYS).find(([, value]) => value === key)?.[0] as keyof typeof KEYBOARD_KEYS;
  
  if (handler && handlers[handler]) {
    event.preventDefault();
    handlers[handler]!();
  }
};

// Focus management utilities
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
  
  return containerRef;
};

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 100);
  };
  
  return { announcement, announce };
};

// Screen reader utilities
export const generateId = (prefix: string = 'element'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getAriaLabel = (element: {
  label?: string;
  title?: string;
  placeholder?: string;
  children?: string;
}): string => {
  return element.label || element.title || element.placeholder || element.children || '';
};

// Reduced motion utilities
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// High contrast utilities
export const useHighContrast = (): boolean => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersHighContrast;
};

// ARIA utilities
export const createAriaDescribedBy = (ids: string[]): string => {
  return ids.filter(Boolean).join(' ');
};

export const createAriaLabelledBy = (ids: string[]): string => {
  return ids.filter(Boolean).join(' ');
};

// Form accessibility utilities
export const getFormFieldProps = (field: {
  id: string;
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
}) => {
  const describedByIds: string[] = [];
  
  if (field.error) describedByIds.push(`${field.id}-error`);
  if (field.description) describedByIds.push(`${field.id}-description`);
  
  return {
    id: field.id,
    'aria-labelledby': field.label ? `${field.id}-label` : undefined,
    'aria-describedby': describedByIds.length > 0 ? createAriaDescribedBy(describedByIds) : undefined,
    'aria-invalid': field.error ? 'true' : undefined,
    'aria-required': field.required ? 'true' : undefined,
  };
};

// Skip link utilities
export const SkipLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
};

// Live region component for announcements
export const LiveRegion = ({ 
  message, 
  priority = 'polite', 
  className = 'sr-only' 
}: {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}) => {
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

// Accessibility audit utilities
export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export const auditColorContrast = (element: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;
  
  if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
    const ratio = getContrastRatio(color, backgroundColor);
    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = computedStyle.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    
    if (!meetsWCAGAA(color, backgroundColor, isLargeText)) {
      issues.push({
        type: 'error',
        rule: 'WCAG 2.1 AA Color Contrast',
        message: `Insufficient color contrast ratio: ${ratio.toFixed(2)}. Required: ${isLargeText ? '3:1' : '4.5:1'}`,
        element,
        severity: 'serious',
      });
    }
  }
  
  return issues;
};

export const auditKeyboardAccessibility = (element: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const tabIndex = element.getAttribute('tabindex');
  
  // Check for interactive elements without proper keyboard support
  const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
  
  const isInteractive = interactiveElements.includes(tagName) || 
                       (role && interactiveRoles.includes(role)) ||
                       element.onclick !== null;
  
  if (isInteractive && tabIndex === '-1' && !element.disabled) {
    issues.push({
      type: 'warning',
      rule: 'Keyboard Accessibility',
      message: 'Interactive element is not keyboard accessible (tabindex="-1")',
      element,
      severity: 'serious',
    });
  }
  
  return issues;
};

export const auditAriaLabels = (element: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const tagName = element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const role = element.getAttribute('role');
  
  // Check for form controls without labels
  const formControls = ['input', 'select', 'textarea'];
  if (formControls.includes(tagName) && !ariaLabel && !ariaLabelledBy) {
    const associatedLabel = document.querySelector(`label[for="${element.id}"]`);
    if (!associatedLabel) {
      issues.push({
        type: 'error',
        rule: 'Form Labels',
        message: 'Form control missing accessible label',
        element,
        severity: 'critical',
      });
    }
  }
  
  // Check for buttons without accessible names
  if (tagName === 'button' || role === 'button') {
    const hasAccessibleName = ariaLabel || ariaLabelledBy || element.textContent?.trim();
    if (!hasAccessibleName) {
      issues.push({
        type: 'error',
        rule: 'Button Names',
        message: 'Button missing accessible name',
        element,
        severity: 'critical',
      });
    }
  }
  
  return issues;
};

export const runAccessibilityAudit = (container: HTMLElement = document.body): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const elements = container.querySelectorAll('*');
  
  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    issues.push(
      ...auditColorContrast(htmlElement),
      ...auditKeyboardAccessibility(htmlElement),
      ...auditAriaLabels(htmlElement)
    );
  });
  
  return issues;
}; 