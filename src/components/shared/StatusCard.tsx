'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';

interface StatusAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

interface StatusCardProps {
  title: string;
  subtitle?: string;
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  amount?: number;
  progress?: number;
  icon?: React.ReactNode;
  actions?: StatusAction[];
  metadata?: { label: string; value: string }[];
  className?: string;
}

const statusConfig = {
  active: { color: 'bg-green-500', label: 'Active', textColor: 'text-green-700' },
  inactive: { color: 'bg-gray-400', label: 'Inactive', textColor: 'text-gray-700' },
  pending: { color: 'bg-yellow-500', label: 'Pending', textColor: 'text-yellow-700' },
  completed: { color: 'bg-blue-500', label: 'Completed', textColor: 'text-blue-700' },
  cancelled: { color: 'bg-red-500', label: 'Cancelled', textColor: 'text-red-700' },
};

export function StatusCard({
  title,
  subtitle,
  status,
  amount,
  progress,
  icon,
  actions = [],
  metadata = [],
  className = ''
}: StatusCardProps) {
  const config = statusConfig[status];

  return (
    <Card className={`overflow-hidden border-l-4 border-l-primary/40 hover-lift transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-foreground leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${config.textColor} border-current`}
          >
            {config.label}
          </Badge>
        </div>

        {/* Progress Bar */}
        {typeof progress === 'number' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${config.color}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Amount Display */}
        {typeof amount === 'number' && (
          <div className="mb-4">
            <p className="text-2xl font-black text-primary tracking-tight">
              {formatCurrency(amount)}
            </p>
          </div>
        )}

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/20 rounded-lg">
            {metadata.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-muted/20">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="text-xs font-medium"
              >
                {action.loading && (
                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}