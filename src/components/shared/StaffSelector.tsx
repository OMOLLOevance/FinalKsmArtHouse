'use client';

import React, { useMemo } from 'react';
import { useStaff } from '@/hooks/useStaff';
import { Select, SelectOption } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';

interface StaffSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  placeholder?: string;
}

export function StaffSelector({ value, onChange, className, placeholder = "Filter by Staff Member" }: StaffSelectorProps) {
  const { staff, loading, canViewStaff } = useStaff();

  const options: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = { value: "all", label: "All Staff" };
    
    const staffOptions: SelectOption[] = staff.map((member) => ({
      value: member.id,
      label: member.first_name || member.last_name 
        ? `${member.first_name || ''} ${member.last_name || ''} (${member.role})`.trim()
        : member.email
    }));

    return [allOption, ...staffOptions];
  }, [staff]);

  if (!canViewStaff) return null;

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading staff...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}