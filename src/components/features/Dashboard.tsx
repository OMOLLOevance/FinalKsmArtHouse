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
// ... (rest of the component)

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
// ...
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summarySections.map((section, idx) => (
          <Card key={idx} className="glass-card border-none shadow-none bg-muted/10 rounded-2xl overflow-hidden">
// ...

export default Dashboard;