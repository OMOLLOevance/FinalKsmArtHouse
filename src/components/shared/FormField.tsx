'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, name, required, disabled, className, error, helpText } = props;
  
  const fieldId = `field-${name}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;

  const renderField = () => {
    switch (props.type) {
      case 'select':
        return (
          <Select
            value={props.value}
            onValueChange={props.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={fieldId}
              className={className}
              aria-describedby={[errorId, helpId].filter(Boolean).join(' ')}
              aria-invalid={!!error}
            >
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>\n          </Select>
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={name}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            disabled={disabled}
            required={required}
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            aria-describedby={[errorId, helpId].filter(Boolean).join(' ')}
            aria-invalid={!!error}
          />
        );

      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={props.type}
            value={props.value}
            onChange={(e) => {
              const value = props.type === 'number' ? Number(e.target.value) : e.target.value;
              props.onChange(value);
            }}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            step={props.step}
            disabled={disabled}
            required={required}
            className={className}
            aria-describedby={[errorId, helpId].filter(Boolean).join(' ')}
            aria-invalid={!!error}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
      >
        {label}
        {required && <Badge variant="destructive" className="text-xs px-1 py-0">Required</Badge>}
      </label>
      
      {renderField()}
      
      {helpText && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
}