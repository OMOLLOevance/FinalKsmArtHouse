import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface RestaurantInventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  expenses: number;
}

export const useRestaurantInventory = (month: string) => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<RestaurantInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('restaurant_sales')
        .select('*')
        .eq('user_id', userId)
        .gte('sale_date', `${month}-01`)
        .lte('sale_date', `${month}-31`)
        .order('sale_date', { ascending: false });

      if (fetchError) throw fetchError;
      setInventory(data || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching restaurant inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading, month]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addInventoryItem = useCallback(async (item: any) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('restaurant_sales')
        .insert([{ 
          user_id: userId,
          sale_date: item.sale_date || new Date().toISOString().split('T')[0],
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_amount: item.totalValue,
          expenses: item.expenses || 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchInventory();
      return data;
    } catch (err) {
      logger.error('Error adding restaurant item:', err);
      throw err;
    }
  }, [userId, fetchInventory]);

  return {
    inventory,
    loading: loading || authLoading,
    error,
    addInventoryItem,
    refetch: fetchInventory,
  };
};