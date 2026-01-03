import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SanitationItem } from '../types';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export const useSanitationItems = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<SanitationItem[]>([]);
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

      const userIsAdmin = user?.role === 'director' || user?.role === 'investor';

      let query = supabase
        .from('sanitation_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sanitation items:', err);
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

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('sanitation_items_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sanitation_items' }, () => {
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchItems, authLoading, userId]);

  const addItem = useCallback(async (item: Omit<SanitationItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sanitation_items')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      // setItems(prev => [data, ...prev]); // Realtime subscription will handle this
      return data;
    } catch (err: any) {
      console.error('Error adding sanitation item:', err);
      throw err;
    }
  }, [userId]);

  const updateItem = useCallback(async (id: string, updates: Partial<SanitationItem>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sanitation_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // setItems(prev => prev.map(item => item.id === id ? data : item)); // Realtime subscription will handle this
      return data;
    } catch (err: any) {
      console.error('Error updating sanitation item:', err);
      throw err;
    }
  }, [userId]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sanitation_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // setItems(prev => prev.filter(item => item.id !== id)); // Realtime subscription will handle this
    } catch (err: any) {
      console.error('Error deleting sanitation item:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { items, loading: combinedLoading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
};