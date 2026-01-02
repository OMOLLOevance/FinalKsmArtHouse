'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  options: SelectOption[];
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  options
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    onValueChange?.(optionValue);
  };

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-sm
          border border-input rounded-md bg-background
          hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-50
          ${isOpen ? 'border-primary ring-2 ring-primary' : ''}
          ${className}
        `}
      >
        <span className={`truncate ${!selectedValue ? 'text-muted-foreground' : 'text-foreground'}`}>
          {displayValue}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full px-3 py-2 text-sm text-left flex items-center justify-between
                hover:bg-muted focus:outline-none focus:bg-muted
                disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedValue === option.value ? 'bg-primary/10 text-primary font-bold' : 'text-popover-foreground'}
              `}
            >
              <span className="truncate">{option.label}</span>
              {selectedValue === option.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${getStatusStyles(status)} ${className}
    `}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export { Select, StatusBadge };
export type { SelectOption, SelectProps };