import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalCustomers: 0,
    pendingServices: 0,
    expiringSoon: 0,
    moduleStats: {
      events: 0,
      gym: 0,
      sauna: 0,
      restaurant: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Initialize with default values
        let customersCount = 0;
        let gymMembersCount = 0;
        let saunaBookingsCount = 0;
        let restaurantSalesCount = 0;
        let totalGymRevenue = 0;
        let totalSaunaRevenue = 0;
        let pendingCustomers = 0;
        let expiringMemberships = 0;

        // Try to fetch data, but handle missing tables gracefully
        try {
          const { count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });
          customersCount = count || 0;
        } catch (err) {
          console.log('Customers table not found, using default value');
        }

        try {
          const { count } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          gymMembersCount = count || 0;
        } catch (err) {
          console.log('Gym members table not found, using default value');
        }

        try {
          const { count } = await supabase
            .from('sauna_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'booked');
          saunaBookingsCount = count || 0;
        } catch (err) {
          console.log('Sauna bookings table not found, using default value');
        }

        try {
          const { count } = await supabase
            .from('restaurant_sales')
            .select('*', { count: 'exact', head: true });
          restaurantSalesCount = count || 0;
        } catch (err) {
          console.log('Restaurant sales table not found, using default value');
        }

        setStats({
          totalRevenue: totalGymRevenue + totalSaunaRevenue,
          totalCustomers: customersCount,
          pendingServices: pendingCustomers,
          expiringSoon: expiringMemberships,
          moduleStats: {
            events: customersCount,
            gym: gymMembersCount,
            sauna: saunaBookingsCount,
            restaurant: restaurantSalesCount
          }
        });
      } catch (err) {
        console.log('Dashboard stats fetch error (using defaults):', err);
        // Use default stats if there's any error
        setStats({
          totalRevenue: 0,
          totalCustomers: 0,
          pendingServices: 0,
          expiringSoon: 0,
          moduleStats: {
            events: 0,
            gym: 0,
            sauna: 0,
            restaurant: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error: null };
};