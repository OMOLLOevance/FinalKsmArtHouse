'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  Waves, 
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import SaunaManagement from '@/components/features/SaunaManagement';
import GymManagement from '@/components/features/GymManagement';
import RestaurantManagement from '@/components/features/RestaurantManagement';
import CustomerManager from '@/components/features/events/CustomerManager';
import Dashboard from '@/components/features/Dashboard';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string>('dashboard');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  if (pathname === '/login') return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      component: 'dashboard',
    },
    {
      id: 'business',
      label: 'Business Operations',
      icon: Building2,
      isSection: true,
      children: [
        { id: 'events', label: 'Event Management', icon: Calendar, component: 'events' },
        { id: 'gym', label: 'Gym Management', icon: Dumbbell, component: 'gym' },
        { id: 'restaurant', label: 'Restaurant', icon: Utensils, component: 'restaurant' },
        { id: 'sauna', label: 'Sauna & Spa', icon: Waves, component: 'sauna' },
      ]
    },
    {
      id: 'management',
      label: 'Customer Management',
      icon: Users,
      isSection: true,
      children: [
        { id: 'customers', label: 'Customer Database', icon: Users, component: 'customers' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, component: 'analytics' },
      ]
    }
  ];

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard': return <Dashboard />;
      case 'sauna': return <SaunaManagement />;
      case 'gym': return <GymManagement />;
      case 'restaurant': return <RestaurantManagement />;
      case 'events': return <CustomerManager />;
      case 'customers': return <CustomerManager />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="glass-panel text-foreground"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        flex flex-col w-80 glass-panel border-r border-white/5 h-screen
        transition-all duration-500 ease-in-out custom-scrollbar overflow-y-auto
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary via-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-xl shadow-primary/30 ring-2 ring-primary/20">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-gradient">
                KSM.ART HOUSE
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Premium Business Suite</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            if (item.isSection) {
              const isExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:bg-white/5 text-foreground/80 hover:text-foreground"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3 text-primary" />
                      {item.label}
                    </div>
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4 transition-transform duration-300" /> : 
                      <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                    }
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.children?.map((child) => {
                        const isActive = activeComponent === child.component;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveComponent(child.component || 'dashboard');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                                : 'text-foreground/60 hover:text-foreground hover:bg-white/5 hover:scale-[1.01]'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 mr-3 ${isActive ? '' : 'text-primary/70'}`} />
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const isActive = activeComponent === item.component;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveComponent(item.component || 'dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'text-foreground/60 hover:text-foreground hover:bg-white/5 hover:scale-[1.01]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? '' : 'text-primary/70'}`} />
                  {item.label}
                </button>
              );
            }
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          <div className="mb-4 px-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-amber-500 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-primary-foreground text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 transition-all duration-300"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar bg-background/95">
          <div className="p-6">
            {renderComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;