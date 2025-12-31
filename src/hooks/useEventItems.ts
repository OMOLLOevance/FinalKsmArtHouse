import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CateringItem, 
  DecorItem, 
  SanitationItem, 
  EntertainmentItem, 
  DJMCBooking 
} from '@/types';

// Remove duplicate type definitions since they're now in @/types


const createHook = <T extends { id: string; user_id?: string; created_at?: string; updated_at?: string },>(tableName: string) => {
  return () => {
    const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth(); // Consume AuthContext
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
      if (authLoading) return;

      try {
        setLoading(true);
        if (!isAuthenticated || !userId) {
          setItems([]);
          setError('User not authenticated');
          return;
        }

        const userIsAdmin = user?.role === 'admin';

        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100); // Limit results for better performance

        if (!userIsAdmin) {
          query = query.eq('user_id', userId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setItems(data || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${tableName}:`, err);
        setError(err instanceof Error ? err.message : `Failed to fetch ${tableName}`);
      } finally {
        setLoading(false);
      }
    }, [userId, isAuthenticated, user?.role, authLoading]);

    useEffect(() => {
      if (!authLoading) { // Only fetch when auth status is known
        fetchItems();
      }
    }, [fetchItems, authLoading]);

    // Optimized real-time subscription with debouncing
    useEffect(() => {
      if (!authLoading && userId) {
        let timeoutId: NodeJS.Timeout;
        
        const channel = supabase
          .channel(`${tableName}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tableName,
            },
            () => {
              // Debounce rapid changes
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                fetchItems();
              }, 500);
            }
          )
          .subscribe();

        return () => {
          clearTimeout(timeoutId);
          supabase.removeChannel(channel);
        };
      }
    }, [fetchItems, authLoading, userId]);

    const addItem = useCallback(async (item: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!userId) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from(tableName)
          .insert([{ ...item, user_id: userId }]) // Use userId from context
          .select()
          .single();

        if (error) throw error;

        // No need to manually update state if realtime subscription is active and calls fetchItems
        // setItems(prev => [data, ...prev]);
        return data;
      } catch (err) {
        console.error(`Error adding ${tableName}:`, err);
        throw err;
      }
    }, [userId, tableName]);

    const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
      try {
        if (!userId) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId) // Ensure only own data can be updated
          .select()
          .single();

        if (error) throw error;

        // setItems(prev => prev.map((item: any) => item.id === id ? data : item));
        return data;
      } catch (err) {
        console.error(`Error updating ${tableName}:`, err);
        throw err;
      }
    }, [userId, tableName]);

    const deleteItem = useCallback(async (id: string) => {
      try {
        if (!userId) throw new Error('User not authenticated');

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)
          .eq('user_id', userId); // Ensure only own data can be deleted

        if (error) throw error;

        // setItems(prev => prev.filter((item: any) => item.id !== id));
      } catch (err) {
        console.error(`Error deleting ${tableName}:`, err);
        throw err;
      }
    }, [userId, tableName]);

    const combinedLoading = loading || authLoading;

    return { items, loading: combinedLoading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
  };
};

export const useCateringItems = createHook<CateringItem>('catering_items');
export const useDecorItemsDB = createHook<DecorItem>('event_items');
export const useSanitationItems = createHook<SanitationItem>('sanitation_items');
export const useEntertainmentEquipment = createHook<EntertainmentItem>('entertainment_equipment');
export const useDJMCBookings = createHook<DJMCBooking>('djmc_bookings');