import { useState, useEffect } from 'react';
import { ensureAuthenticated, isAdmin as checkIsAdmin } from '../utils/authHelpers';
import { supabase } from '../lib/supabase';

export interface DecorItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity_available: number;
  unit: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export const useDecorItems = () => {
  const [items, setItems] = useState<DecorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const user = await ensureAuthenticated();
      if (!user?.id) {
        console.log('❌ No authenticated user found');
        setItems([]);
        return;
      }

      console.log('📥 Fetching décor items for user:', user.email, 'Role:', user.role);

      // Use role from the logged-in user object (from custom_users table)
      const isAdmin = user.role === 'admin';

      let query = supabase
        .from('decor_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        console.log('👤 User is not admin, filtering by user_id:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.log('👑 User is admin, fetching all décor items');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log(`✅ Fetched ${data?.length || 0} décor items`);
      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching décor items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('decor_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decor_items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem = async (item: Omit<DecorItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await ensureAuthenticated();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('decor_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding decor item:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<DecorItem>) => {
    try {
      const { data, error } = await supabase
        .from('decor_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err: any) {
      console.error('Error updating decor item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('decor_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting decor item:', err);
      throw err;
    }
  };

  return { items, loading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
};
