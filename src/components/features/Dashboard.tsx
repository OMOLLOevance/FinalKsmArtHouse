import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Dumbbell, Waves, ChefHat, TrendingUp, DollarSign, AlertTriangle, Clock, BarChart3, ChevronDown, ChevronUp, Database, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import DatabaseStatus from '@/components/ui/DatabaseStatus';
import DatabaseSetup from '@/components/ui/DatabaseSetup';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { stats, loading, error } = useDashboardStats();
  const [isRecentActivityCollapsed, setIsRecentActivityCollapsed] = useState(false);
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);

  const handleModuleClick = (moduleId: string) => {
    if (onNavigate) {
      onNavigate(moduleId);
    } else {
      router.push(`/${moduleId}`);
    }
  };

  const modules = [
    { 
      id: 'events', 
      title: 'Events', 
      icon: Calendar, 
      description: 'Manage event bookings and services',
      stats: `${stats.moduleStats.events} customers`
    },
    { 
      id: 'gym', 
      title: 'Gym', 
      icon: Dumbbell, 
      description: 'Track gym memberships and finances',
      stats: `${stats.moduleStats.gym} active members`
    },
    { 
      id: 'sauna', 
      title: 'Sauna & Spa', 
      icon: Waves, 
      description: 'Manage sauna and spa bookings',
      stats: `${stats.moduleStats.sauna} bookings`
    },
    { 
      id: 'restaurant', 
      title: 'Restaurant', 
      icon: ChefHat, 
      description: 'Track restaurant sales and profits',
      stats: `${stats.moduleStats.restaurant} entries`
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Database Setup Required</p>
          <p className="text-sm text-muted-foreground mb-4">Please set up the database tables to continue</p>
          <Button onClick={() => setShowDatabaseSetup(true)}>Setup Database</Button>
        </div>
        {showDatabaseSetup && <DatabaseSetup />}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Executive Dashboard</h1>
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
          Welcome back to the KSM.ART HOUSE management suite.
        </p>
      </div>

      {/* Database Status Panel */}
      {showDatabaseStatus && (
        <DatabaseStatus onClose={() => setShowDatabaseStatus(false)} />
      )}

      {/* Quick Stats - All Unified to Navy/Gold */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              KSH {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined Earnings</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique Clients</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.pendingServices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires Attention</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renewals Due</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.expiringSoon}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expiring Soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Modules - Refined Professional Look */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className="cursor-pointer group border-white/5 bg-card/40 hover:bg-card/60 transition-all duration-500"
            onClick={() => handleModuleClick(module.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-500">
                <module.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-1 text-foreground group-hover:text-primary transition-colors duration-300">
                {module.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {module.description}
              </p>
              <Badge variant="outline" className="border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                {module.stats}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-white/5 bg-card/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Business Intelligence</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRecentActivityCollapsed(!isRecentActivityCollapsed)}
            className="hover:bg-primary/10 hover:text-primary"
          >
            {isRecentActivityCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        
        {!isRecentActivityCollapsed && (
          <CardContent>
             <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary opacity-40" />
              </div>
              <p className="text-lg font-medium text-foreground">Awaiting Data Streams</p>
              <p className="text-sm text-muted-foreground">Operational updates will appear here in real-time.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;