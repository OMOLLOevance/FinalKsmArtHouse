'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  UsersIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';

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
    <Card className="p-6 hover-lift glass-panel border-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-800/40">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        <Badge variant={trend === 'up' ? 'default' : 'secondary'} className="text-xs">
          {change}
        </Badge>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gradient">{value}</h3>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  </motion.div>
);

const InvestorDashboard: React.FC = () => {
  const metrics = [
    {
      title: 'Monthly Revenue',
      value: '$127,500',
      change: '+23.5%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6 text-primary" />,
      description: 'Across all business units'
    },
    {
      title: 'Active Customers',
      value: '2,847',
      change: '+12.3%',
      trend: 'up' as const,
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      description: 'Monthly active users'
    },
    {
      title: 'Events Booked',
      value: '156',
      change: '+8.7%',
      trend: 'up' as const,
      icon: <CalendarIcon className="h-6 w-6 text-primary" />,
      description: 'This month'
    },
    {
      title: 'Avg. Order Value',
      value: '$89.50',
      change: '+15.2%',
      trend: 'up' as const,
      icon: <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />,
      description: 'Restaurant & services'
    }
  ];

  const businessUnits = [
    {
      name: 'Event Management',
      revenue: '$52,300',
      growth: '+28%',
      icon: <SparklesIcon className="h-8 w-8 text-primary" />,
      description: 'Premium event planning & execution'
    },
    {
      name: 'Restaurant Operations',
      revenue: '$38,200',
      growth: '+18%',
      icon: <BuildingStorefrontIcon className="h-8 w-8 text-primary" />,
      description: 'Fine dining & catering services'
    },
    {
      name: 'Gym & Fitness',
      revenue: '$24,800',
      growth: '+22%',
      icon: <ChartBarIcon className="h-8 w-8 text-primary" />,
      description: 'Premium fitness memberships'
    },
    {
      name: 'Sauna & Spa',
      revenue: '$12,200',
      growth: '+35%',
      icon: <FireIcon className="h-8 w-8 text-primary" />,
      description: 'Luxury wellness experiences'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-gradient">
            KSM.ART HOUSE
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Integrated Business Management Platform
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-sm">
              🚀 Revenue Growth: +23.5%
            </Badge>
            <Badge variant="outline" className="text-sm">
              📈 Customer Satisfaction: 98.2%
            </Badge>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Business Units Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-8 glass-panel border-0 bg-gradient-to-br from-white/90 to-white/60 dark:from-gray-900/90 dark:to-gray-800/60">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-bold text-gradient">
                  Business Units Performance
                </h2>
                <p className="text-muted-foreground">
                  Comprehensive revenue breakdown across all operations
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businessUnits.map((unit, index) => (
                  <motion.div
                    key={unit.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="p-3 rounded-full bg-primary/10">
                      {unit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-lg">{unit.name}</h3>
                        <Badge variant="default" className="text-xs">
                          {unit.growth}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary mb-1">{unit.revenue}</p>
                      <p className="text-sm text-muted-foreground">{unit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Investment Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-8 glass-panel border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-serif font-bold text-gradient">
                Investment Opportunity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">4</div>
                  <div className="text-sm font-medium">Integrated Business Units</div>
                  <div className="text-xs text-muted-foreground">
                    Events, Restaurant, Gym, Sauna
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">98.2%</div>
                  <div className="text-sm font-medium">Customer Satisfaction</div>
                  <div className="text-xs text-muted-foreground">
                    Premium service quality
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">$1.5M</div>
                  <div className="text-sm font-medium">Annual Revenue Target</div>
                  <div className="text-xs text-muted-foreground">
                    Projected 12-month growth
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InvestorDashboard;