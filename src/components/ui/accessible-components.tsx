'use client';

import React, { useId, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { announceToScreenReader, FocusManager } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Accessible Skip Link Component
 * Allows keyboard users to skip to main content
 */
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-blue-600 text-white px-4 py-2 rounded-md z-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Accessible Live Region Component
 * For dynamic content announcements
 */
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ message, priority = 'polite', className }: LiveRegionProps) {
  const regionId = useId();
  
  return (
    <div
      id={regionId}
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
}

/**
 * Accessible Status Message Component
 * Shows status messages with proper ARIA attributes
 */
interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
  autoAnnounce?: boolean;
  className?: string;
}

export function StatusMessage({ 
  type, 
  message, 
  onDismiss, 
  autoAnnounce = true,
  className 
}: StatusMessageProps) {
  const messageId = useId();
  
  useEffect(() => {
    if (autoAnnounce) {
      const priority = type === 'error' ? 'assertive' : 'polite';
      announceToScreenReader(message, priority);
    }
  }, [message, type, autoAnnounce]);
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };
  
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  const Icon = icons[type];
  
  return (
    <div
      id={messageId}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'border rounded-md p-4 mb-4',
        styles[type],
        className
      )}
    >
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current hover:text-current/80 ml-2"
            aria-label={`Dismiss ${type} message`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Accessible Modal Component
 * Implements proper focus trapping and ARIA attributes
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  
  useEffect(() => {
    if (!isOpen) return;
    
    FocusManager.saveFocus();
    
    const cleanup = modalRef.current 
      ? FocusManager.trapFocus(modalRef.current)
      : () => {};
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      cleanup();
      document.removeEventListener('keydown', handleEscape);
      FocusManager.restoreFocus();
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto',
          'focus:outline-none',
          className
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {description && (
            <p id={descriptionId} className="text-gray-600 mb-4">
              {description}
            </p>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Accessible Progress Bar Component
 * Shows progress with proper ARIA attributes
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const progressId = useId();
  const labelId = useId();
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label id={labelId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage}%</span>
          )}
        </div>
      )}
      
      <div
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? labelId : undefined}
        aria-valuetext={`${percentage}% complete`}
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Accessible Loading Spinner Component
 * Announces loading state to screen readers
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function AccessibleLoadingSpinner({
  size = 'md',
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center', className)}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizes[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Accessible Breadcrumb Component
 * Provides navigation context with proper ARIA attributes
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AccessibleBreadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="text-gray-400 mx-2" aria-hidden="true">
                /
              </span>
            )}
            
            {item.current ? (
              <span
                aria-current="page"
                className="text-gray-900 font-medium"
              >
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-gray-600">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
