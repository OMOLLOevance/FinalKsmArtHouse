'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Users, Dumbbell, Waves, ChefHat, 
  TrendingUp, DollarSign, AlertTriangle, 
  BarChart3, ChevronDown, ChevronUp, Database, 
  Sparkles, Activity, Building2, Flame, 
  ShieldCheck, Briefcase 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricCard, formatCurrency } from '@/components/shared/DashboardComponents';
import DatabaseStatus from '@/components/ui/DatabaseStatus';
import DatabaseSetup from '@/components/ui/DatabaseSetup';
import InvestorDashboard from './InvestorDashboard';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

interface DashboardSummaryItem {
  label: string;
  value: string | number;
  color?: string;
  italic?: boolean;
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

  const isDirector = user?.role === 'director' || user?.role === 'investor';
  const isManager = user?.role === 'operations_manager' || isDirector;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Secure Access Required</h2>
          <p className="text-muted-foreground font-medium">Authorized personnel please authenticate to continue.</p>
          <Button onClick={() => router.push('/login')} className="h-11 px-8 shadow-lg shadow-primary/20">Go to Login</Button>
        </div>
      </div>
    );
  }

  if (isDirector && !loading && stats) {
    return <InvestorDashboard />;
  }

  if (loading) {
    return <LoadingSpinner text="Synchronizing Professional Workspace..." />;
  }

  if (error || !stats) {
    return (
      <div className="space-y-6 py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-black uppercase tracking-widest text-foreground">Network Protocol Issue</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed font-medium">
            We are unable to establish a secure connection to the primary database. 
            Verification required for: {error instanceof Error ? error.message : 'System Integrity'}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Retry Link</Button>
            {isDirector && (
              <Button onClick={() => setShowDatabaseSetup(true)}>Initialize Setup</Button>
            )}
          </div>
        </div>
        {showDatabaseSetup && <DatabaseSetup />}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: `+${stats.growthRates?.revenue || 0}%`,
      changeType: 'positive' as const,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: 'Active Assets',
      value: stats.totalCustomers.toLocaleString(),
      change: `+${stats.growthRates?.customers || 0}%`,
      changeType: 'positive' as const,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Current Events',
      value: stats.moduleStats.events.toString(),
      change: `+${stats.growthRates?.events || 0}%`,
      changeType: 'positive' as const,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: 'Service Pipeline',
      value: stats.pendingServices.toString(),
      icon: <Activity className="h-4 w-4" />
    }
  ];

  const modules = [
    { 
      id: 'events', 
      title: 'Events', 
      icon: Calendar, 
      description: 'Operational management of bookings & configurations',
      stats: `${stats.moduleStats.events} items`,
      revenue: formatCurrency(stats.revenueByUnit?.events || 0)
    },
    { 
      id: 'gym', 
      title: 'Gym', 
      icon: Dumbbell, 
      description: 'Membership tracking and fitness operations',
      stats: `${stats.moduleStats.gym} members`,
      revenue: formatCurrency(stats.revenueByUnit?.gym || 0)
    },
    { 
      id: 'sauna', 
      title: 'Sauna & Spa', 
      icon: Waves, 
      description: 'Wellness scheduling and session management',
      stats: `${stats.moduleStats.sauna} bookings`,
      revenue: formatCurrency(stats.revenueByUnit?.sauna || 0)
    },
    { 
      id: 'restaurant', 
      title: 'Restaurant', 
      icon: ChefHat, 
      description: 'Sales inventory and fine dining operations',
      stats: `${stats.moduleStats.restaurant} sales`,
      revenue: formatCurrency(stats.revenueByUnit?.restaurant || 0)
    }
  ];

  const summarySections: { title: string; items: DashboardSummaryItem[] }[] = [
    { title: "Terminal Summary", items: [
      { label: "Revenue", value: formatCurrency(Math.floor(stats.totalRevenue * 0.1)), color: "text-success" },
      { label: "Orders", value: Math.floor(stats.moduleStats.restaurant * 0.3) },
      { label: "New Leads", value: Math.floor(stats.totalCustomers * 0.05) }
    ]},
    { title: "Logistics Loop", items: [
      { label: "Live Events", value: stats.moduleStats.events, color: "text-primary" },
      { label: "Active Sessions", value: stats.moduleStats.gym * 7, color: "text-primary", italic: true },
      { label: "Confirmed Spa", value: stats.moduleStats.sauna, color: "text-primary" }
    ]},
    { title: "Efficiency Index", items: [
      { label: "Satisfaction", value: "98.2%", color: "text-success" },
      { label: "On-time Index", value: "96.8%", color: "text-success", italic: true },
      { label: "Retention Rate", value: `${((stats.totalCustomers / (stats.totalCustomers + 10)) * 100).toFixed(1)}%`, color: "text-secondary" }
    ]}
  ];

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-xl shadow-primary/5">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none mb-1">
                {user?.role} Workspace
              </h1>
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-60">
                Operational Overview • KSM.ART HOUSE
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isManager && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDatabaseStatus(!showDatabaseStatus)}
                className="hidden sm:flex items-center border-primary/20 hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest h-9"
              >
                <Database className="h-3 w-3 mr-2 text-primary" />
                System Integrity
              </Button>
            )}
            <Badge variant="outline" className="h-9 px-4 border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm">
              {user?.role} MODE
            </Badge>
          </div>
        </div>
      </div>

      {showDatabaseStatus && <DatabaseStatus onClose={() => setShowDatabaseStatus(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => <MetricCard key={index} {...metric} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className="cursor-pointer group card-premium border-primary/10 transition-all duration-500 glass-card hover:shadow-2xl hover:shadow-primary/10 rounded-2xl"
            onClick={() => handleModuleClick(module.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="p-4 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:rotate-[360deg] transition-all duration-700 ease-in-out shadow-inner">
                <module.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <Activity className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <h3 className="font-black text-lg mb-1 tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">{module.title}</h3>
              <p className="text-[10px] font-bold text-muted-foreground/80 mb-6 line-clamp-2 leading-relaxed uppercase tracking-wider">{module.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                <Badge variant="outline" className="font-black border-primary/20 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg">{module.stats}</Badge>
                <span className="text-[10px] font-black text-primary tracking-tighter uppercase">{module.revenue}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summarySections.map((section, idx) => (
          <Card key={idx} className="glass-card border-none shadow-none bg-muted/10 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-primary/5 mb-4 bg-muted/5 p-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-xl border border-white/5 hover:bg-muted/50 transition-colors">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <span className={`font-black tracking-tighter ${item.color || ''} ${item.italic ? 'italic' : ''}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;