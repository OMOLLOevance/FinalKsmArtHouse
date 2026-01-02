'use client';

import React, { useState, Suspense, lazy } from 'react';
import { Utensils, Palette, Users, Wrench, Music, FileText, ArrowLeft, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy components for better performance
const CateringManager = lazy(() => import('./CateringManager'));
const CustomerManager = lazy(() => import('./CustomerManager'));
const QuotationManager = lazy(() => import('./QuotationManager'));
const EventCategoryManager = lazy(() => import('./EventCategoryManager'));
const EventPaymentForm = lazy(() => import('./EventPaymentForm'));
const DecorManagement = lazy(() => import('../DecorManagement'));
const CustomerRequirements = lazy(() => import('../CustomerRequirements'));

interface EventManagementProps {
  onBack?: () => void;
}

const EventManagement: React.FC<EventManagementProps> = ({ onBack }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const router = useRouter();

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === 'customers') {
      router.push('/customers');
    } else {
      setActiveModule(moduleId);
    }
  };

  const modules = [
    { 
      id: 'catering', 
      title: 'Catering', 
      icon: Utensils, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      description: 'Manage food and beverage services' 
    },
    { 
      id: 'payments', 
      title: 'Payments', 
      icon: DollarSign, 
      color: 'text-success', 
      bg: 'bg-success/10',
      description: 'Log event payments and financial records' 
    },
    { 
      id: 'decor', 
      title: 'Decor', 
      icon: Palette, 
      color: 'text-secondary', 
      bg: 'bg-secondary/10',
      description: 'Manage event decorations and themes' 
    },
    { 
      id: 'customers', 
      title: 'Customers', 
      icon: Users, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Advanced customer management with monthly allocations' 
    },
    { 
      id: 'requirements', 
      title: 'Requirements', 
      icon: FileText, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-100 dark:bg-indigo-900/20',
      description: 'View customer decor requirements' 
    },
    { 
      id: 'quotation', 
      title: 'Quotation', 
      icon: FileText, 
      color: 'text-teal-600 dark:text-teal-400', 
      bg: 'bg-teal-100 dark:bg-teal-900/20',
      description: 'Create and manage price quotations' 
    },
    { 
      id: 'sanitation', 
      title: 'Sanitation', 
      icon: Wrench, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      description: 'Manage cleaning and maintenance' 
    },
    { 
      id: 'entertainment', 
      title: 'Entertainment', 
      icon: Music, 
      color: 'text-violet-600 dark:text-violet-400', 
      bg: 'bg-violet-100 dark:bg-violet-900/20',
      description: 'Manage music and performance acts' 
    },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'catering':
        return <CateringManager onBack={() => setActiveModule(null)} />;
      case 'customers':
        return <CustomerManager onBack={() => setActiveModule(null)} />;
      case 'requirements':
        return <CustomerRequirements onBack={() => setActiveModule(null)} />;
      case 'quotation':
        return <QuotationManager onBack={() => setActiveModule(null)} />;
      case 'payments':
        return (
          <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => setActiveModule(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <EventPaymentForm />
          </div>
        );
      case 'decor':
        return <DecorManagement onBack={() => setActiveModule(null)} />;
      case 'sanitation':
        return <EventCategoryManager onBack={() => setActiveModule(null)} category="sanitation" title="Sanitation Management" />;
      case 'entertainment':
        return <EventCategoryManager onBack={() => setActiveModule(null)} category="entertainment" title="Entertainment Management" />;
      default:
        return <div className="text-center p-8">Module not available</div>;
    }
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
            onClick={() => handleModuleClick(module.id)}
            className="cursor-pointer group hover-lift hover-glow border-primary/5 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{module.title}</CardTitle>
              <div className={`p-3 rounded-2xl ${module.bg} group-hover:scale-110 transition-transform duration-500`}>
                <module.icon className={`h-6 w-6 ${module.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default EventManagement;