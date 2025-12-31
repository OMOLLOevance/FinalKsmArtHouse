import { useState, useEffect } from 'react';
import { ensureAuthenticated, isAdmin as checkIsAdmin } from '../utils/authHelpers';
import { supabase } from '../lib/supabase';
import { RestaurantSale } from '../types';

export const useRestaurantSales = () => {
  const [sales, setSales] = useState<RestaurantSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      const user = await ensureAuthenticated();

      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('restaurant_sales')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setSales(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurant sales:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Real-time subscription for restaurant sales
    const channel = supabase
      .channel('restaurant_sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_sales' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSales(prev => [payload.new as RestaurantSale, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSales(prev => prev.map(s => s.id === payload.new.id ? payload.new as RestaurantSale : s));
          } else if (payload.eventType === 'DELETE') {
            setSales(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addSale = async (sale: Omit<RestaurantSale, 'id'>) => {
    try {
      const user = await ensureAuthenticated();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('restaurant_sales')
        .insert([{ ...sale, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setSales(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding restaurant sale:', err);
      throw err;
    }
  };

  const updateSale = async (id: string, updates: Partial<RestaurantSale>) => {
    try {
      const user = await ensureAuthenticated();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('restaurant_sales')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSales(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (err) {
      console.error('Error updating restaurant sale:', err);
      throw err;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const user = await ensureAuthenticated();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('restaurant_sales')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting restaurant sale:', err);
      throw err;
    }
  };

  return { sales, loading, error, addSale, updateSale, deleteSale, refetch: fetchSales };
};
