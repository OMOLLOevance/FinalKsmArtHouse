'use client';

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  BarChart3,
  Activity,
  Building2,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-brand-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-brand-muted">
        {title}
      </CardTitle>
      <div className="h-5 w-5 text-brand-primary">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-brand-text">{value}</div>
      <p className={`text-xs font-medium ${
        changeType === 'positive' ? 'text-brand-secondary' : 'text-red-500'
      }`}>
        {change} from last month
      </p>
    </CardContent>
  </Card>
);

const ProfessionalDashboard: React.FC = () => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: 'KSH 127,500',
      change: '+23.5%',
      changeType: 'positive' as const,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: 'Active Customers',
      value: '2,847',
      change: '+12.3%',
      changeType: 'positive' as const,
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Events Booked',
      value: '156',
      change: '+8.7%',
      changeType: 'positive' as const,
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Growth Rate',
      value: '15.2%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: <TrendingUp className="h-5 w-5" />
    }
  ];

  const businessUnits = [
    {
      name: 'Event Management',
      revenue: 'KSH 52,300',
      percentage: 41,
      growth: '+28%',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-brand-primary'
    },
    {
      name: 'Restaurant',
      revenue: 'KSH 38,200',
      percentage: 30,
      growth: '+18%',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-brand-secondary'
    },
    {
      name: 'Gym & Fitness',
      revenue: 'KSH 24,800',
      percentage: 19,
      growth: '+22%',
      icon: <Activity className="h-5 w-5" />,
      color: 'bg-brand-accent'
    },
    {
      name: 'Sauna & Spa',
      revenue: 'KSH 12,200',
      percentage: 10,
      growth: '+35%',
      icon: <Flame className="h-5 w-5" />,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">
              KSM.ART HOUSE Dashboard
            </h1>
            <p className="text-brand-muted mt-1">
              Business Management Overview
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✅ All Systems Operational
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              📊 Real-time Data
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Business Units Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center text-brand-text">
                <BarChart3 className="h-5 w-5 mr-2 text-brand-primary" />
                Revenue by Business Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {businessUnits.map((unit, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${unit.color} text-white shadow-sm`}>
                        {unit.icon}
                      </div>
                      <span className="font-medium text-brand-text text-sm sm:text-base">{unit.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand-text text-sm sm:text-base">{unit.revenue}</div>
                      <div className="text-xs sm:text-sm text-brand-secondary font-medium">{unit.growth}</div>
                    </div>
                  </div>
                  <div className="w-full bg-brand-border rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${unit.color} transition-all duration-500`}
                      style={{ width: `${unit.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-brand-border">
            <CardHeader>
              <CardTitle className="text-brand-text">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">New event booking confirmed</p>
                    <p className="text-xs text-brand-muted">Wedding ceremony - June 15th</p>
                  </div>
                  <span className="text-xs text-brand-muted flex-shrink-0">2 min ago</span>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-2 h-2 bg-brand-secondary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">Restaurant order completed</p>
                    <p className="text-xs text-brand-muted">Table 12 - KSH 4,500</p>
                  </div>
                  <span className="text-xs text-brand-muted flex-shrink-0">15 min ago</span>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="w-2 h-2 bg-brand-accent rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">New gym membership</p>
                    <p className="text-xs text-brand-muted">3-month package - John Doe</p>
                  </div>
                  <span className="text-xs text-brand-muted flex-shrink-0">1 hour ago</span>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">Sauna session booked</p>
                    <p className="text-xs text-brand-muted">Premium package - 2 hours</p>
                  </div>
                  <span className="text-xs text-brand-muted flex-shrink-0">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-brand-border">
            <CardHeader>
              <CardTitle className="text-lg text-brand-text">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Revenue</span>
                  <span className="font-semibold text-brand-text">KSH 8,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Orders</span>
                  <span className="font-semibold text-brand-text">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">New Customers</span>
                  <span className="font-semibold text-brand-text">7</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-border">
            <CardHeader>
              <CardTitle className="text-lg text-brand-text">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Events</span>
                  <span className="font-semibold text-brand-text">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Gym Sessions</span>
                  <span className="font-semibold text-brand-text">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Spa Bookings</span>
                  <span className="font-semibold text-brand-text">34</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-border">
            <CardHeader>
              <CardTitle className="text-lg text-brand-text">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Customer Satisfaction</span>
                  <span className="font-semibold text-brand-secondary">98.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">On-time Delivery</span>
                  <span className="font-semibold text-brand-secondary">96.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Repeat Customers</span>
                  <span className="font-semibold text-brand-primary">74.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;