'use client';

import React, { useState, Suspense, lazy } from 'react';
import { Utensils, Palette, Users, Wrench, Music, FileText, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy components for better performance
const CateringManager = lazy(() => import('./CateringManager'));
const DecorManager = lazy(() => import('./DecorManager'));
const CustomerManager = lazy(() => import('./CustomerManager'));
const SanitationManager = lazy(() => import('./SanitationManager'));
const EntertainmentManager = lazy(() => import('./EntertainmentManager'));
const QuotationManager = lazy(() => import('./QuotationManager'));

interface EventManagementProps {
  onBack?: () => void;
}

const EventManagement: React.FC<EventManagementProps> = ({ onBack }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules = [
    { 
      id: 'catering', 
      title: 'Catering', 
      icon: Utensils, 
      color: 'text-pink-600', 
      bg: 'bg-pink-100',
      description: 'Manage food and beverage services' 
    },
    { 
      id: 'decor', 
      title: 'Decor', 
      icon: Palette, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      description: 'Manage event decorations and themes' 
    },
    { 
      id: 'customers', 
      title: 'Customers', 
      icon: Users, 
      color: 'text-red-900', 
      bg: 'bg-red-100',
      description: 'Manage client details and history' 
    },
    { 
      id: 'quotation', 
      title: 'Quotation', 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      description: 'Create and manage price quotations' 
    },
    { 
      id: 'sanitation', 
      title: 'Sanitation', 
      icon: Wrench, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100',
      description: 'Manage cleaning and maintenance' 
    },
    { 
      id: 'entertainment', 
      title: 'Entertainment', 
      icon: Music, 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      description: 'Manage music and performance acts' 
    },
  ];

  const renderModule = () => {
    const ModuleComponent = () => {
      switch (activeModule) {
        case 'catering':
          return <CateringManager onBack={() => setActiveModule(null)} />;
        case 'decor':
          return <DecorManager onBack={() => setActiveModule(null)} />;
        case 'customers':
          return <CustomerManager onBack={() => setActiveModule(null)} />;
        case 'quotation':
          return <QuotationManager onBack={() => setActiveModule(null)} />;
        case 'sanitation':
          return <SanitationManager onBack={() => setActiveModule(null)} />;
        case 'entertainment':
          return <EntertainmentManager onBack={() => setActiveModule(null)} />;
        default:
          return null;
      }
    };

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ModuleComponent />
      </Suspense>
    );
  };

  if (activeModule) {
    return renderModule();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Event Management</h2>
            <p className="text-muted-foreground">Manage all aspects of your events</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">{module.title}</CardTitle>
              <div className={`p-2 rounded-full ${module.bg}`}>
                <module.icon className={`h-6 w-6 ${module.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventManagement;