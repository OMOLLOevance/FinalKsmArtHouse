'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      href: '/',
    },
    {
      id: 'business',
      label: 'Business Operations',
      icon: Building2,
      isSection: true,
      children: [
        { id: 'events', label: 'Event Management', icon: Calendar, href: '/events' },
        { id: 'gym', label: 'Gym Management', icon: Dumbbell, href: '/gym' },
        { id: 'restaurant', label: 'Restaurant', icon: Utensils, href: '/restaurant' },
        { id: 'sauna', label: 'Sauna & Spa', icon: Waves, href: '/sauna' },
      ]
    },
    {
      id: 'management',
      label: 'Customer Management',
      icon: Users,
      isSection: true,
      children: [
        { id: 'customers', label: 'Customer Database', icon: Users, href: '/customers' },
      ]
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/90 backdrop-blur-sm border-border text-foreground hover:bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        flex flex-col w-72 sm:w-80 bg-card border-r border-border h-screen
        transition-all duration-300 ease-in-out overflow-y-auto
        shadow-xl md:shadow-none
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                KSM.ART HOUSE
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Premium Business Suite</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-2">
          {navItems.map((item) => {
            if (item.isSection) {
              const isExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary" />
                      <span className="text-sm sm:text-base">{item.label}</span>
                    </div>
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" /> : 
                      <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                    }
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-3 sm:ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children?.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.href)}
                            className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 mr-2 sm:mr-3 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                            <span className="text-sm">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href!)}
                  className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </button>
              );
            }
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="mb-3 sm:mb-4 px-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 text-sm"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;