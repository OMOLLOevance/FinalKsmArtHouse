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
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="h-4 w-4 text-muted-foreground">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
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
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: 'Active Customers',
      value: '2,847',
      change: '+12.3%',
      changeType: 'positive' as const,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Events Booked',
      value: '156',
      change: '+8.7%',
      changeType: 'positive' as const,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: 'Growth Rate',
      value: '15.2%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: <TrendingUp className="h-4 w-4" />
    }
  ];

  const businessUnits = [
    {
      name: 'Event Management',
      revenue: 'KSH 52,300',
      percentage: 41,
      growth: '+28%',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Restaurant',
      revenue: 'KSH 38,200',
      percentage: 30,
      growth: '+18%',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      name: 'Gym & Fitness',
      revenue: 'KSH 24,800',
      percentage: 19,
      growth: '+22%',
      icon: <Activity className="h-5 w-5" />,
      color: 'bg-purple-500'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              KSM.ART HOUSE Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Business Management Overview
            </p>
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✅ All Systems Operational
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              📊 Real-time Data
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Business Units Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Revenue by Business Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {businessUnits.map((unit, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${unit.color} text-white`}>
                        {unit.icon}
                      </div>
                      <span className="font-medium">{unit.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{unit.revenue}</div>
                      <div className="text-sm text-green-600">{unit.growth}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${unit.color}`}
                      style={{ width: `${unit.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New event booking confirmed</p>
                    <p className="text-xs text-gray-500">Wedding ceremony - June 15th</p>
                  </div>
                  <span className="text-xs text-gray-400">2 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Restaurant order completed</p>
                    <p className="text-xs text-gray-500">Table 12 - KSH 4,500</p>
                  </div>
                  <span className="text-xs text-gray-400">15 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New gym membership</p>
                    <p className="text-xs text-gray-500">3-month package - John Doe</p>
                  </div>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sauna session booked</p>
                    <p className="text-xs text-gray-500">Premium package - 2 hours</p>
                  </div>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-semibold">KSH 8,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Orders</span>
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Customers</span>
                  <span className="font-semibold">7</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Events</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gym Sessions</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Spa Bookings</span>
                  <span className="font-semibold">34</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-green-600">98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">On-time Delivery</span>
                  <span className="font-semibold text-green-600">96.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Repeat Customers</span>
                  <span className="font-semibold text-blue-600">74.5%</span>
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