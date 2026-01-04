import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EntertainmentItem } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from './useRoleGuard';

export const useEntertainmentItems = (filterUserId?: string | null) => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isStaff } = useRoleGuard();
  const [items, setItems] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) return;

    try {
      setLoading(true);

      let query = supabase
        .from('entertainment_equipment')
        .select('*, users(first_name, last_name, email, role)')
        .order('created_at', { ascending: false });

      // RBAC Filtering Logic
      if (isStaff()) {
        query = query.eq('user_id', userId);
      } else if (filterUserId) {
        query = query.eq('user_id', filterUserId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching entertainment items:', err);
      setError(err?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading, filterUserId, isStaff]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('entertainment_equipment_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entertainment_equipment' }, () => {
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchItems, authLoading, userId]);

  const addItem = useCallback(async (item: Omit<EntertainmentItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('entertainment_equipment')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error adding entertainment item:', err);
      throw err;
    }
  }, [userId]);

  const updateItem = useCallback(async (id: string, updates: Partial<EntertainmentItem>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('entertainment_equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error updating entertainment item:', err);
      throw err;
    }
  }, [userId]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('entertainment_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting entertainment item:', err);
      throw err;
    }
  }, [userId]);

  return { items, loading: loading || authLoading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
};