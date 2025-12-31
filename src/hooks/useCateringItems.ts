import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CateringItem } from '../types';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { getAuthenticatedUser } from '../utils/authHelpers'; // For admin check

export const useCateringItems = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CateringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (authLoading) return; // Don't fetch if auth is still loading

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setItems([]);
        setError('User not authenticated');
        return;
      }

      const userIsAdmin = user?.role === 'admin';

      let query = supabase
        .from('catering_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userIsAdmin) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching catering items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchItems();
    }
  }, [fetchItems, authLoading]);

  // Realtime subscription setup
  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('catering_items_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'catering_items' }, () => {
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchItems, authLoading, userId]);

  const addItem = useCallback(async (item: Omit<CateringItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('catering_items')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding catering item:', err);
      throw err;
    }
  }, [userId]);

  const updateItem = useCallback(async (id: string, updates: Partial<CateringItem>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('catering_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure only own data can be updated
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err: any) {
      console.error('Error updating catering item:', err);
      throw err;
    }
  }, [userId]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('catering_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure only own data can be deleted

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting catering item:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { items, loading: combinedLoading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
};