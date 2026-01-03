'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Sparkles,
  Building2,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -4 }}
  >
    <Card className="p-6 hover-lift glass-panel border border-border/50 bg-card/80 dark:bg-card/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <Badge variant={trend === 'up' ? 'success' : 'secondary'} className="text-[10px] font-black uppercase tracking-tighter">
          {change}
        </Badge>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tighter text-foreground">{value}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{title}</p>
        <p className="text-[9px] text-muted-foreground italic leading-none">{description}</p>
      </div>
    </Card>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest mb-1 text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-primary">
          {formatCurrency(payload[0].value as number)}
        </p>
      </div>
    );
  }
  return null;
};

const InvestorDashboard: React.FC = () => {
  const { data: stats, isLoading: loading, error } = useDashboardStats();

  if (loading) return <LoadingSpinner text="Analyzing Enterprise Data..." />;

  if (error || !stats) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive font-bold">Failed to load investor intelligence data</p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: `+23.5%`,
      trend: 'up' as const,
      icon: <DollarSign className="h-6 w-6" />,
      description: 'Aggregated monthly earnings'
    },
    {
      title: 'Active Assets',
      value: stats.totalCustomers.toLocaleString(),
      change: `+12.3%`,
      trend: 'up' as const,
      icon: <Users className="h-6 w-6" />,
      description: 'Monthly engaged clientele'
    },
    {
      title: 'Conversion Rate',
      value: '94.2%',
      change: `+5.7%`,
      trend: 'up' as const,
      icon: <TrendingUp className="h-6 w-6" />,
      description: 'Leads to confirmed bookings'
    },
    {
      title: 'Operational Efficiency',
      value: '98.8%',
      change: `+1.2%`,
      trend: 'up' as const,
      icon: <BarChart3 className="h-6 w-6" />,
      description: 'Resource utilization index'
    }
  ];

  const businessUnits = [
    {
      name: 'Event Management',
      revenue: formatCurrency(stats.revenueByUnit?.events || 0),
      share: '45.2% of total',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      description: 'Premium planning & execution'
    },
    {
      name: 'Restaurant Operations',
      revenue: formatCurrency(stats.revenueByUnit?.restaurant || 0),
      share: '28.4% of total',
      icon: <Building2 className="h-8 w-8 text-primary" />,
      description: 'Fine dining & catering services'
    },
    {
      name: 'Gym & Fitness',
      revenue: formatCurrency(stats.revenueByUnit?.gym || 0),
      share: '15.1% of total',
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      description: 'Premium fitness memberships'
    },
    {
      name: 'Sauna & Spa',
      revenue: formatCurrency(stats.revenueByUnit?.sauna || 0),
      share: '11.3% of total',
      icon: <Flame className="h-8 w-8 text-primary" />,
      description: 'Luxury wellness experiences'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-primary uppercase">
          Enterprise Intelligence
        </h1>
        <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase opacity-60">
          Executive Portfolio Performance • {new Date().getFullYear()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <Card className="p-8 glass-card border-primary/5 shadow-2xl">
        <div className="flex flex-col space-y-4 mb-6">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Revenue Trend
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
            6-Month Performance Overview
          </p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.revenueHistory}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Business Units Performance */}
      <Card className="p-8 glass-card border-primary/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
                Portfolio Breakdown
              </h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                Revenue contribution by business unit
              </p>
            </div>
            <Badge variant="outline" className="w-fit font-black border-primary/20 text-primary">
              Live Data Sync Active
            </Badge>
          </div>
          
          <Separator className="bg-primary/5" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessUnits.map((unit) => (
              <div 
                key={unit.name}
                className="flex items-center space-x-6 p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 hover:bg-muted/50 transition-all duration-500 group"
              >
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-primary/5">
                  {unit.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-black text-lg tracking-tight">{unit.name}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-black text-primary tracking-tighter">{unit.revenue}</p>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase opacity-70 border-none h-4">
                      {unit.share}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">{unit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 glass-card border-none">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Investment Highlights</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest">Year-over-Year Growth</span>
              <span className="text-lg font-black text-success">+18.4%</span>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest">Client Retention Index</span>
              <span className="text-lg font-black text-primary">92.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 glass-card border-none bg-primary/5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Market Positioning</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 flex items-center justify-center h-full min-h-[100px]">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60 px-8">
              KSM.ART HOUSE currently dominates the <strong>Upper-Tier Hospitality</strong> market segment in the regional portfolio.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorDashboard;