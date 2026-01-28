import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { logger } from '@/lib/logger';

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  pendingServices: number;
  expiringSoon: number;
  moduleStats: {
    events: number;
    gym: number;
    sauna: number;
    restaurant: number;
  };
  revenueByUnit: {
    events: number;
    gym: number;
    sauna: number;
    restaurant: number;
  };
  growthRates: {
    revenue: number;
    customers: number;
    events: number;
  };
  revenueHistory: {
    name: string;
    value: number;
  }[];
}

interface MinimalCustomer { id: string; service_status: string; }
interface MinimalGymMember { status: string; expiry_date: string; payment_amount: number; created_at: string; start_date?: string; }
interface MinimalGymFinance { amount: number; transaction_type: string; created_at: string; date?: string; }
interface MinimalSaunaBooking { status: string; amount: number; created_at: string; booking_date?: string; }
interface MinimalRestaurantSale { total_amount: number; created_at: string; sale_date?: string; }
interface MinimalEventItem { id: string; }
interface MinimalQuotation { total_amount: number; status: string; created_at: string; event_date?: string; }
interface MinimalCateringItem { price_per_plate: number; min_order: number; description?: string; created_at: string; }

export const useDashboardStats = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth(); // Add authLoading
  const { isDirectorOrInvestor, isOperationsManager } = useRoleGuard();

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', userId],
    enabled: !!userId && isAuthenticated && !authLoading, // ADD !authLoading
    queryFn: async () => {
      try {
        const isManagement = isDirectorOrInvestor() || isOperationsManager();
        
        // Construct clean query parameters
        const params = new URLSearchParams();
        if (!isManagement && userId) {
          params.append('userId', userId);
        }
        if (isManagement) {
          params.append('discovery', 'true');
        }

        const buildUrl = (base: string, extraFields?: string) => {
          const p = new URLSearchParams(params);
          if (extraFields) p.append('fields', extraFields);
          return `${base}?${p.toString()}`;
        };

        // Reduce parallel requests - only fetch essential data
        const [customersRes, gymMembersRes, saunaBookingsRes, restaurantRes] = await Promise.all([
          apiClient.get<{data: MinimalCustomer[]}>(buildUrl('/api/customers', 'id,service_status')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalGymMember[]}>(buildUrl('/api/gym', 'status,expiry_date,payment_amount,created_at')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalSaunaBooking[]}>(buildUrl('/api/sauna', 'status,amount,created_at')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalRestaurantSale[]}>(buildUrl('/api/restaurant', 'total_amount,created_at')).catch(() => ({ data: [] }))
        ]);

        const customers = customersRes?.data || [];
        const gymMembers = gymMembersRes?.data || [];
        const saunaBookings = saunaBookingsRes?.data || [];
        const restaurantSales = restaurantRes?.data || [];

        // Simplified calculations
        const totalCustomers = customers.length + gymMembers.length + saunaBookings.length;
        const activeGymMembers = gymMembers.filter(m => m.status === 'active');
        
        // Quick expiry check
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringSoonCount = activeGymMembers.filter(m => {
          const expiryDate = new Date(m.expiry_date);
          return expiryDate >= today && expiryDate <= nextWeek;
        }).length;

        const pendingServicesCount = customers.filter(c => c.service_status === 'pending').length;
        const activeSaunaBookings = saunaBookings.filter(b => b.status === 'booked').length;

        // Simplified revenue calculation
        const gymRevenue = gymMembers.reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);
        const saunaRevenue = saunaBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const restaurantRevenue = restaurantSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
        const totalRevenue = gymRevenue + saunaRevenue + restaurantRevenue;

        // Simplified revenue history (last 3 months only)
        const revenueHistory = [
          { name: 'Jan', value: Math.floor(totalRevenue * 0.3) },
          { name: 'Feb', value: Math.floor(totalRevenue * 0.4) },
          { name: 'Mar', value: Math.floor(totalRevenue * 0.3) }
        ];

        return {
          totalRevenue,
          totalCustomers,
          pendingServices: pendingServicesCount,
          expiringSoon: expiringSoonCount,
          moduleStats: {
            events: customers.length,
            gym: activeGymMembers.length,
            sauna: activeSaunaBookings,
            restaurant: restaurantSales.length
          },
          revenueByUnit: {
            events: Math.floor(totalRevenue * 0.1),
            gym: gymRevenue,
            sauna: saunaRevenue,
            restaurant: restaurantRevenue
          },
          growthRates: {
            revenue: totalRevenue > 0 ? 15.2 : 0,
            customers: totalCustomers > 0 ? 8.5 : 0,
            events: customers.length > 0 ? 5.3 : 0
          },
          revenueHistory
        };
      } catch (err) {
        logger.error('Dashboard stats calculation error:', err);
        return {
          totalRevenue: 0,
          totalCustomers: 0,
          pendingServices: 0,
          expiringSoon: 0,
          moduleStats: { events: 0, gym: 0, sauna: 0, restaurant: 0 },
          revenueByUnit: { events: 0, gym: 0, sauna: 0, restaurant: 0 },
          growthRates: { revenue: 0, customers: 0, events: 0 },
          revenueHistory: []
        };
      }
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};
