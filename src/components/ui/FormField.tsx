'use client';

import { ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertCircle, Info } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

interface RadioFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
}

interface SwitchFieldProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

function FieldWrapper({
  children,
  label,
  description,
  error,
  required,
  className,
  id,
}: BaseFieldProps & { children: ReactNode }) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <motion.div
      className={cn('space-y-2', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-muted-foreground flex items-start gap-2"
        >
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {description}
        </p>
      )}

      <div className="relative">{children}</div>

      {error && (
        <motion.p
          id={errorId}
          className="text-sm text-destructive flex items-start gap-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { label, description, error, required, className, type = 'text', ...props },
    ref
  ) => {
    const fieldId =
      props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <FieldWrapper
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
        id={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          type={type}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          aria-required={required}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          value={props.value}
          onChange={(e) => props.onChange?.(e.target.value)}
          placeholder={props.placeholder}
          disabled={props.disabled}
          maxLength={props.maxLength}
        />
      </FieldWrapper>
    );
  }
);

TextField.displayName = 'TextField';

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ label, description, error, required, className, ...props }, ref) => {
  const fieldId =
    props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      id={fieldId}
    >
      <Textarea
        ref={ref}
        id={fieldId}
        aria-describedby={cn(descriptionId, errorId)}
        aria-invalid={!!error}
        aria-required={required}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive'
        )}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        rows={props.rows}
        maxLength={props.maxLength}
      />
    </FieldWrapper>
  );
});

TextareaField.displayName = 'TextareaField';

export function SelectField({
  label,
  description,
  error,
  required,
  className,
  options,
  ...props
}: SelectFieldProps) {
  const fieldId =
    props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      id={fieldId}
    >
      <Select
        value={props.value}
        onValueChange={props.onChange}
        disabled={props.disabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          aria-required={required}
          className={cn(error && 'border-destructive focus:ring-destructive')}
        >
          <SelectValue placeholder={props.placeholder} />
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
    </FieldWrapper>
  );
}

export function CheckboxField({
  label,
  description,
  error,
  required,
  className,
  ...props
}: CheckboxFieldProps) {
  const fieldId =
    props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      id={fieldId}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={fieldId}
          checked={props.checked}
          onCheckedChange={props.onChange}
          disabled={props.disabled}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          aria-required={required}
        />
        <Label htmlFor={fieldId} className="text-sm font-normal cursor-pointer">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
    </FieldWrapper>
  );
}

export function RadioField({
  label,
  description,
  error,
  required,
  className,
  options,
  ...props
}: RadioFieldProps) {
  const fieldId =
    props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      id={fieldId}
    >
      <RadioGroup
        value={props.value}
        onValueChange={props.onChange}
        disabled={props.disabled}
        aria-describedby={cn(descriptionId, errorId)}
        aria-invalid={!!error}
        aria-required={required}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${fieldId}-${option.value}`}
              disabled={option.disabled}
            />
            <Label
              htmlFor={`${fieldId}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FieldWrapper>
  );
}

export function SwitchField({
  label,
  description,
  error,
  required,
  className,
  ...props
}: SwitchFieldProps) {
  const fieldId =
    props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      id={fieldId}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Switch
          id={fieldId}
          checked={props.checked}
          onCheckedChange={props.onChange}
          disabled={props.disabled}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          aria-required={required}
        />
      </div>
    </FieldWrapper>
  );
}
