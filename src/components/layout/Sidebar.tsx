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
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navItems = [
  { id: 'dashboard', label: 'Intelligence Hub', icon: LayoutDashboard, href: '/', roles: ['admin', 'director', 'manager', 'staff'] },
  {
    id: 'business',
    label: 'Operations',
    icon: Building2,
    isSection: true,
    roles: ['admin', 'director', 'manager', 'staff'],
    children: [
      { id: 'events', label: 'Event Management', icon: Calendar, href: '/events', roles: ['admin', 'director', 'manager', 'staff'] },
      { id: 'gym', label: 'Gym Management', icon: Dumbbell, href: '/gym', roles: ['admin', 'director', 'manager', 'staff'] },
      { id: 'restaurant', label: 'Restaurant', icon: Utensils, href: '/restaurant', roles: ['admin', 'director', 'manager', 'staff'] },
      { id: 'sauna', label: 'Sauna & Spa', icon: Waves, href: '/sauna', roles: ['admin', 'director', 'manager', 'staff'] },
    ]
  },
  {
    id: 'management',
    label: 'Client Relations',
    icon: Users,
    isSection: true,
    roles: ['admin', 'director', 'manager'],
    children: [
      { id: 'customers', label: 'Customer Database', icon: Users, href: '/customers', roles: ['admin', 'director', 'manager'] },
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
    management: true,
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

  // Filter items based on role
  const filteredNavItems = useMemo(() => {
    if (!user?.role) return [];
    return navItems.filter(item => item.roles.includes(user.role)).map(item => ({
      ...item,
      children: item.children?.filter(child => child.roles.includes(user.role))
    }));
  }, [user?.role]);

  // Only render full sidebar on client
  if (!mounted) {
    return <div className="hidden md:flex w-72 bg-card border-r h-screen" />;
  }

  return (
    <>
      {/* ... Mobile Header Bar ... */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-primary/5 z-40 flex items-center justify-between px-4 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black tracking-tighter text-primary text-sm uppercase">KSM.ART</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="hover:bg-primary/10 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
        </Button>
      </div>

      {/* ... Backdrop ... */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-40 animate-in fade-in duration-300 print:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        flex flex-col w-[85vw] sm:w-72 bg-card/95 backdrop-blur-xl border-r border-primary/10 h-screen
        transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-y-auto
        print:hidden shadow-2xl shadow-primary/5
      `}>
        <div className="p-8 border-b border-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-indigo-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-primary leading-none mb-1">KSM.ART</h1>
                <p className="text-[9px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">Management Suite</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {filteredNavItems.map((item) => {
            if (item.isSection) {
              const isExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-2 py-2">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    <span>{item.label}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-1">
                      {item.children?.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.href)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/5 hover:translate-x-1'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-primary/60'}`} />
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
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5 hover:translate-x-1'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-primary/60'}`} />
                  <span>{item.label}</span>
                </button>
              );
            }
          })}
        </nav>

        <div className="p-6 border-t border-primary/5 bg-primary/5 backdrop-blur-sm">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-primary-foreground text-sm font-black shadow-inner">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate text-foreground">{user.email?.split('@')[0]}</p>
                  <Badge variant="outline" className="text-[8px] uppercase font-black py-0 px-1.5 border-primary/30 text-primary">{user.role}</Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive font-black text-[10px] uppercase tracking-widest h-10"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="h-20 bg-muted animate-pulse rounded-2xl" />
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;