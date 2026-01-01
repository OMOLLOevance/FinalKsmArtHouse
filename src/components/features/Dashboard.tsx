import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Dumbbell, Waves, ChefHat, TrendingUp, DollarSign, AlertTriangle, Clock, BarChart3, ChevronDown, ChevronUp, Database, Sparkles, Activity, Building2, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricCard, calculateRevenueShare, formatCurrency } from '@/components/shared/DashboardComponents';
import DatabaseStatus from '@/components/ui/DatabaseStatus';
import DatabaseSetup from '@/components/ui/DatabaseSetup';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading: loading, error } = useDashboardStats();
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);


  const handleModuleClick = (moduleId: string) => {
    if (onNavigate) {
      onNavigate(moduleId);
    } else {
      router.push(`/${moduleId}`);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to KSM.ART HOUSE</h2>
          <p className="text-muted-foreground">Please log in to access the dashboard</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Database Connection Issue</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Please set up the database tables to continue'}
          </p>
          <Button onClick={() => setShowDatabaseSetup(true)}>Setup Database</Button>
        </div>
        {showDatabaseSetup && <DatabaseSetup />}
      </div>
    );
  }


  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: `+${stats.growthRates?.revenue || 0}%`,
      changeType: 'positive' as const,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: 'Active Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: `+${stats.growthRates?.customers || 0}%`,
      changeType: 'positive' as const,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Events Booked',
      value: stats.moduleStats.events.toString(),
      change: `+${stats.growthRates?.events || 0}%`,
      changeType: 'positive' as const,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingServices.toString(),
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ];

  const modules = [
    { 
      id: 'events', 
      title: 'Events', 
      icon: Calendar, 
      description: 'Manage event bookings and services',
      stats: `${stats.moduleStats.events} items`,
      revenue: formatCurrency(stats.revenueByUnit?.events || 0)
    },
    { 
      id: 'gym', 
      title: 'Gym', 
      icon: Dumbbell, 
      description: 'Track gym memberships and finances',
      stats: `${stats.moduleStats.gym} members`,
      revenue: formatCurrency(stats.revenueByUnit?.gym || 0)
    },
    { 
      id: 'sauna', 
      title: 'Sauna & Spa', 
      icon: Waves, 
      description: 'Manage sauna and spa bookings',
      stats: `${stats.moduleStats.sauna} bookings`,
      revenue: formatCurrency(stats.revenueByUnit?.sauna || 0)
    },
    { 
      id: 'restaurant', 
      title: 'Restaurant', 
      icon: ChefHat, 
      description: 'Track restaurant sales and profits',
      stats: `${stats.moduleStats.restaurant} sales`,
      revenue: formatCurrency(stats.revenueByUnit?.restaurant || 0)
    }
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary opacity-80" />
            <h1 className="text-3xl font-serif font-black tracking-tight text-luxury">KSM.ART HOUSE Dashboard</h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatabaseStatus(!showDatabaseStatus)}
            className="flex items-center border-primary/20 hover:bg-primary/10"
          >
            <Database className="h-4 w-4 mr-2 text-primary" />
            Database Status
          </Button>
        </div>
        <p className="text-muted-foreground">
          Business management overview and navigation
        </p>
      </div>

      {showDatabaseStatus && (
        <DatabaseStatus onClose={() => setShowDatabaseStatus(false)} />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Business Modules with Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className="cursor-pointer group hover-lift hover-glow border-primary/5 transition-all duration-300"
            onClick={() => handleModuleClick(module.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="p-3 rounded-xl bg-primary/5 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-500">
                <module.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
            </CardHeader>

            <CardContent>
              <h3 className="font-bold text-lg mb-1 text-foreground group-hover:text-primary transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {module.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-semibold">
                  {module.stats}
                </Badge>
                <span className="text-xs font-bold text-success">
                  {module.revenue}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="font-semibold">{formatCurrency(Math.floor(stats.totalRevenue * 0.1))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Orders</span>
              <span className="font-semibold">{Math.floor(stats.moduleStats.restaurant * 0.3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Customers</span>
              <span className="font-semibold">{Math.floor(stats.totalCustomers * 0.05)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Events</span>
              <span className="font-semibold">{stats.moduleStats.events}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gym Sessions</span>
              <span className="font-semibold">{stats.moduleStats.gym * 7}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Spa Bookings</span>
              <span className="font-semibold">{stats.moduleStats.sauna}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
              <span className="font-semibold text-success">98.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">On-time Delivery</span>
              <span className="font-semibold text-success">96.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Repeat Customers</span>
              <span className="font-semibold text-secondary">{((stats.totalCustomers / (stats.totalCustomers + 10)) * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;