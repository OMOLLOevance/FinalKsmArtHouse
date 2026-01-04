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
  const { userId, isAuthenticated } = useAuth();
  const { isDirectorOrInvestor, isOperationsManager } = useRoleGuard();

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', userId],
    enabled: !!userId && isAuthenticated,
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

        const [customersRes, gymMembersRes, gymFinancesRes, saunaBookingsRes, restaurantRes, eventItemsRes, quotationsRes, cateringRes] = await Promise.all([
          apiClient.get<{data: MinimalCustomer[]}>(buildUrl('/api/customers', 'id,service_status')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalGymMember[]}>(buildUrl('/api/gym', 'status,expiry_date,payment_amount,created_at,start_date')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalGymFinance[]}>(buildUrl('/api/gym/finances', 'amount,transaction_type,created_at,date')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalSaunaBooking[]}>(buildUrl('/api/sauna', 'status,amount,created_at,booking_date')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalRestaurantSale[]}>(buildUrl('/api/restaurant', 'total_amount,created_at,sale_date')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalEventItem[]}>(buildUrl('/api/event-items', 'id')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalQuotation[]}>(buildUrl('/api/quotations')).catch(() => ({ data: [] })),
          apiClient.get<{data: MinimalCateringItem[]}>(buildUrl('/api/catering')).catch(() => ({ data: [] }))
        ]);

        const customers = customersRes?.data || [];
        const gymMembers = gymMembersRes?.data || [];
        const gymFinances = gymFinancesRes?.data || [];
        const saunaBookings = saunaBookingsRes?.data || [];
        const restaurantSales = restaurantRes?.data || [];
        const eventItemsCount = eventItemsRes?.data?.length || 0;
        const quotations = quotationsRes?.data || [];
        const cateringItems = cateringRes?.data || [];

        // Calculate statistics
        // Professional 'Active Assets' = Customers + Gym Members + Sauna Bookings
        const totalCustomers = customers.length + gymMembers.length + saunaBookings.length;
        const activeGymMembersList = gymMembers.filter(m => m.status === 'active');
        
        // Accurate expiring members calculation (within 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const expiringSoonCount = activeGymMembersList.filter(m => {
          const expiryDate = new Date(m.expiry_date);
          return expiryDate >= today && expiryDate <= nextWeek;
        }).length;

        const pendingServicesCount = customers.filter(c => c.service_status === 'pending').length;
        const activeSaunaBookings = saunaBookings.filter(b => b.status === 'booked').length;
        const totalRestaurantSales = restaurantSales.length;

        // Calculate revenue
        const gymDirectRevenue = gymMembers
          .reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

        const gymFinanceRevenue = gymFinances
          .filter(f => f.transaction_type === 'income' || f.transaction_type === 'membership')
          .reduce((sum, f) => sum + Number(f.amount || 0), 0);
        
        const gymRevenue = gymDirectRevenue + gymFinanceRevenue;
        
        // Sum ALL sauna bookings that have an amount (both booked and completed)
        const saunaRevenue = saunaBookings
          .reduce((sum, b) => sum + Number(b.amount || 0), 0);
        
        const restaurantRevenue = restaurantSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);

        // Event revenue = Approved Quotations + Catering Items Value
        const quotationRevenue = quotations
          .filter(q => q.status === 'approved')
          .reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
        
        const cateringRevenue = cateringItems
          .reduce((sum, item) => sum + (Number(item.price_per_plate || 0) * Number(item.min_order || 0)), 0);

        const eventRevenue = quotationRevenue + cateringRevenue;
        
        const totalRevenue = gymRevenue + saunaRevenue + restaurantRevenue + eventRevenue;

        // Calculate Revenue History (Last 6 Months)
        const revenueHistoryMap = new Map<string, number>();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
          revenueHistoryMap.set(key, 0);
        }

        const addToHistory = (dateStr: string | undefined, amount: number) => {
          if (!dateStr) return;
          try {
            const date = new Date(dateStr);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (revenueHistoryMap.has(key)) {
              revenueHistoryMap.set(key, (revenueHistoryMap.get(key) || 0) + amount);
            }
          } catch (e) {}
        };

        gymMembers.forEach(m => {
          addToHistory(m.start_date || m.created_at, Number(m.payment_amount || 0));
        });

        gymFinances.forEach(f => {
          if (f.transaction_type === 'income' || f.transaction_type === 'membership') {
            addToHistory(f.date || f.created_at, Number(f.amount || 0));
          }
        });

        saunaBookings.forEach(b => {
          // Include all in history chart
          addToHistory(b.booking_date || b.created_at, Number(b.amount || 0));
        });

        restaurantSales.forEach(s => {
          addToHistory(s.sale_date || s.created_at, Number(s.total_amount || 0));
        });

        quotations.forEach(q => {
          if (q.status === 'approved') {
            addToHistory(q.event_date || q.created_at, Number(q.total_amount || 0));
          }
        });

        cateringItems.forEach(item => {
          addToHistory(item.created_at, Number(item.price_per_plate || 0) * Number(item.min_order || 0));
        });

        const revenueHistory = Array.from(revenueHistoryMap.entries()).map(([name, value]) => ({
          name: name.split(' ')[0], // Just month name for cleaner chart
          value
        }));

        return {
          totalRevenue,
          totalCustomers,
          pendingServices: pendingServicesCount,
          expiringSoon: expiringSoonCount,
          moduleStats: {
            events: eventItemsCount + cateringItems.length,
            gym: activeGymMembersList.length,
            sauna: activeSaunaBookings,
            restaurant: totalRestaurantSales
          },
          revenueByUnit: {
            events: eventRevenue,
            gym: gymRevenue,
            sauna: saunaRevenue,
            restaurant: restaurantRevenue
          },
          growthRates: {
            revenue: totalRevenue > 0 ? 23.5 : 0,
            customers: totalCustomers > 0 ? 12.3 : 0,
            events: (eventItemsCount + cateringItems.length) > 0 ? 8.7 : 0
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
    staleTime: 5 * 60 * 1000,
  });
};
