import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
}

export const MetricCard = React.memo(({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon
}: MetricCardProps) => (
  <Card className="hover-lift hover-glow border-primary/5 transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="h-4 w-4 text-muted-foreground">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {change && (
        <p className={`text-xs font-medium ${
          changeType === 'positive' ? 'text-success' : 'text-destructive'
        }`}>
          {change} from last month
        </p>
      )}
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';


export const calculateRevenueShare = (unitRevenue: number, totalRevenue: number): string => {
  if (totalRevenue === 0) return '0%';
  return `${((unitRevenue / totalRevenue) * 100).toFixed(1)}% of total`;
};

export const formatCurrency = (amount: number): string => {
  return `KSH ${amount.toLocaleString()}`;
};