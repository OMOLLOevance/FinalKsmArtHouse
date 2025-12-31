import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
// Define RestaurantInventoryItem locally
interface RestaurantInventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  lastUpdated: string;
}
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export const useRestaurantInventory = (month: string) => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<RestaurantInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (authLoading) return; // Don't fetch if auth is still loading

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setInventory([]); // Clear inventory if not authenticated
        setError('User not authenticated');
        return;
      }

      const userIsAdmin = user?.role === 'admin';

      const query = supabase
        .from('restaurant_monthly_inventory')
        .select('*')
        .eq('month', month)
        .order('purchase_date', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInventory(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      console.error('❌ Error fetching inventory:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, isAuthenticated, user, authLoading, month]); // Add month dependency

  useEffect(() => {
    if (!authLoading) { // Only fetch when auth status is known
      fetchInventory();
    }
  }, [fetchInventory, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel(`restaurant_inventory_${month}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'restaurant_monthly_inventory',
            filter: `month=eq.${month}`
          },
          () => {
            fetchInventory();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchInventory, authLoading, userId, month]);

  const addInventoryItem = useCallback(async (item: Omit<RestaurantInventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('restaurant_monthly_inventory')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (insertError) throw insertError;

      // setInventory(prev => [data, ...prev]); // Realtime subscription handles this
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add inventory item');
      console.error('Error adding inventory item:', err);
      throw err;
    }
  }, [userId]);

  const updateInventoryItem = useCallback(async (id: string, updates: Partial<RestaurantInventoryItem>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error: updateError } = await supabase
        .from('restaurant_monthly_inventory')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only update their own
        .select()
        .single();

      if (updateError) throw updateError;

      // setInventory(prev => prev.map(item => item.id === id ? data : item)); // Realtime subscription handles this
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory item');
      console.error('Error updating inventory item:', err);
      throw err;
    }
  }, [userId]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('restaurant_monthly_inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure user can only delete their own

      if (deleteError) throw deleteError;

      // setInventory(prev => prev.filter(item => item.id !== id)); // Realtime subscription handles this
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory item');
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  }, [userId]);

  const getMonthlyTotals = useCallback(() => {
    return inventory.reduce((totals, item) => ({
      totalCost: totals.totalCost + item.totalValue,
      totalExpenses: totals.totalExpenses + 0, // No expenses field in our interface
      netAmount: totals.netAmount + item.totalValue,
    }), { totalCost: 0, totalExpenses: 0, netAmount: 0 });
  }, [inventory]); // Dependency on inventory

  const combinedLoading = loading || authLoading;

  return {
    inventory,
    loading: combinedLoading,
    error,
    syncing,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getMonthlyTotals,
    refetch: fetchInventory,
  };
};
