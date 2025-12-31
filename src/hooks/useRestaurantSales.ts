import { useState, useEffect } from 'react';
import { ensureAuthenticated, isAdmin as checkIsAdmin } from '../utils/authHelpers';
import { supabase } from '../lib/supabase';

export interface RestaurantSale {
  id: string;
  date: string;
  total_sales: number;
  total_expenses: number;
  profit: number;
  items_sold?: any;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export const useRestaurantSales = () => {
  const [sales, setSales] = useState<RestaurantSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      const user = await ensureAuthenticated();
      const isAdmin = await checkIsAdmin();

      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('restaurant_sales')
        .select('*')
        .order('date', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setSales(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching restaurant sales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel('restaurant_sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_sales' }, () => {
        fetchSales();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addSale = async (sale: Omit<RestaurantSale, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await ensureAuthenticated();

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('restaurant_sales')
        .insert([{ ...sale, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setSales(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding restaurant sale:', err);
      throw err;
    }
  };

  const updateSale = async (id: string, updates: Partial<RestaurantSale>) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSales(prev => prev.map(sale => sale.id === id ? data : sale));
      return data;
    } catch (err: any) {
      console.error('Error updating restaurant sale:', err);
      throw err;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSales(prev => prev.filter(sale => sale.id !== id));
    } catch (err: any) {
      console.error('Error deleting restaurant sale:', err);
      throw err;
    }
  };

  return { sales, loading, error, addSale, updateSale, deleteSale, refetch: fetchSales };
};
