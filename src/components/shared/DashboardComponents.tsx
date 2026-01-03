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
  <Card className="hover-lift glow-primary border-primary/10 transition-all duration-500 glass-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
        {title}
      </CardTitle>
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tighter text-foreground">{value}</div>
      {change && (
        <div className="flex items-center mt-1 space-x-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            changeType === 'positive' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {change}
          </span>
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">vs last month</span>
        </div>
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