export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'KSM.ART HOUSE',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Complete business management system',
  version: '1.0.0',
  
  navigation: {
    items: [
      { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/events', label: 'Events', icon: 'Calendar' },
      { href: '/gym', label: 'Gym', icon: 'Dumbbell' },
      { href: '/restaurant', label: 'Restaurant', icon: 'Utensils' },
      { href: '/sauna', label: 'Sauna & Spa', icon: 'Waves' },
      { href: '/customers', label: 'Customers', icon: 'Users' },
    ]
  },
  
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    statsCards: [
      { key: 'totalRevenue', label: 'Total Revenue', icon: 'DollarSign' },
      { key: 'totalCustomers', label: 'Total Customers', icon: 'Users' },
      { key: 'pendingServices', label: 'Pending Services', icon: 'AlertTriangle' },
      { key: 'expiringSoon', label: 'Expiring Soon', icon: 'Clock' }
    ]
  },
  
  ui: {
    sidebar: {
      width: '16rem', // 64 in Tailwind (w-64)
      mobileBreakpoint: 'md'
    },
    animations: {
      sidebarTransition: 'duration-300 ease-in-out'
    }
  }
} as const;

export type AppConfig = typeof APP_CONFIG;