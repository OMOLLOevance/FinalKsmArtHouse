'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Dumbbell, Utensils, Waves, Calendar, 
  Users, LogOut, Menu, X, ChevronDown, ChevronRight, 
  Building2, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
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

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === '/login') return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  // Only render full sidebar on client to prevent hydration issues
  if (!mounted) {
    return <div className="hidden md:flex w-72 bg-card border-r h-screen" />;
  }

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card/90 backdrop-blur-sm shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 print:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        flex flex-col w-72 bg-card border-r border-border h-screen
        transition-all duration-300 ease-in-out overflow-y-auto
        print:hidden
      `}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-primary">KSM.ART HOUSE</h1>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">Premium Suite</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            if (item.isSection) {
              const isExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-4 h-4 mr-3 text-primary opacity-70" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {item.children?.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.href)}
                            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <child.icon className="w-4 h-4 mr-3" />
                            <span>{child.label}</span>
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
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  <span>{item.label}</span>
                </button>
              );
            }
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/20">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 px-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{user.role}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/5"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;