import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from './useRoleGuard';
import { logger } from '@/lib/logger';

interface RestaurantInventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  expenses: number;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export const useRestaurantInventory = (month: string, filterUserId?: string | null) => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isStaff } = useRoleGuard();
  const [inventory, setInventory] = useState<RestaurantInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('restaurant_sales')
        .select('*, users(first_name, last_name, email, role)')
        .gte('sale_date', `${month}-01`)
        .lte('sale_date', `${month}-31`)
        .order('sale_date', { ascending: false });

      // RBAC Filtering Logic
      if (isStaff()) {
        // Staff can ONLY see their own records
        query = query.eq('user_id', userId);
      } else if (filterUserId) {
        // Managers/Directors can see all, but filter if requested
        query = query.eq('user_id', filterUserId);
      }
      // If Manager/Director and no filterUserId, query returns all (RLS allows it)

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setInventory(data || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching restaurant inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading, month, filterUserId, isStaff]);

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