// DEPRECATED: Use useRestaurantSalesQuery from use-restaurant-api.ts instead
// This file is kept for backward compatibility during migration

import { useState, useEffect } from 'react';
import { RestaurantSale } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { safeLog } from '@/lib/sanitizer';

// MIGRATION NOTICE: Replace with useRestaurantSalesQuery from @/hooks/use-restaurant-api
export const useRestaurantSales = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sales, setSales] = useState<RestaurantSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    if (authLoading || !isAuthenticated || !userId) {
      setSales([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/restaurant?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch restaurant sales');
      }
      
      setSales(result.data || []);
      setError(null);
    } catch (err) {
      safeLog.error('Error fetching restaurant sales:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurant sales';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [userId, isAuthenticated, authLoading]);

  const addSale = async (sale: Omit<RestaurantSale, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...sale })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add restaurant sale');
      }
      
      await fetchSales();
      toast.success('Restaurant sale added successfully');
      return result.data;
    } catch (err) {
      safeLog.error('Error adding restaurant sale:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add sale';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateSale = async (id: string, updates: Partial<RestaurantSale>) => {
    toast.info('Update functionality will be implemented');
  };

  const deleteSale = async (id: string) => {
    toast.info('Delete functionality will be implemented');
  };

  return { sales, loading, error, addSale, updateSale, deleteSale, refetch: fetchSales };
};
