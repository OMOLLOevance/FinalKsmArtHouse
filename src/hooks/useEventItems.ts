// DEPRECATED: Use backend API services instead of direct Supabase calls
// This file is kept for backward compatibility during migration

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { safeLog } from '@/lib/sanitizer';
import { 
  CateringItem, 
  DecorItem, 
  SanitationItem, 
  EntertainmentItem, 
  DJMCBooking 
} from '@/types';

// MIGRATION NOTICE: Replace these hooks with backend API services:
// - useCateringItems -> useCateringItemsQuery from @/hooks/use-event-api
// - useDecorItemsDB -> useEventItemsQuery from @/hooks/use-event-api
// - useSanitationItems -> Backend API service needed
// - useEntertainmentEquipment -> Backend API service needed
// - useDJMCBookings -> Backend API service needed

const createHook = <T extends { id: string; user_id?: string; created_at?: string; updated_at?: string },>(tableName: string) => {
  return () => {
    const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
      if (authLoading || !isAuthenticated || !userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use backend API instead of direct Supabase
        const response = await fetch(`/api/${tableName}?userId=${userId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to fetch ${tableName}`);
        }
        
        setItems(result.data || []);
        setError(null);
      } catch (err) {
        safeLog.error(`Error fetching ${tableName}:`, err);
        const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${tableName}`;
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [userId, isAuthenticated, authLoading]);

    useEffect(() => {
      fetchItems();
    }, [fetchItems]);

    const addItem = useCallback(async (item: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!userId) throw new Error('User not authenticated');

        const response = await fetch(`/api/${tableName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...item })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to add ${tableName}`);
        }
        
        await fetchItems();
        toast.success(`${tableName} added successfully`);
        return result.data;
      } catch (err) {
        safeLog.error(`Error adding ${tableName}:`, err);
        const errorMessage = err instanceof Error ? err.message : `Failed to add ${tableName}`;
        toast.error(errorMessage);
        throw err;
      }
    }, [userId, tableName, fetchItems]);

    const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
      toast.info('Update functionality will be implemented');
    }, []);

    const deleteItem = useCallback(async (id: string) => {
      toast.info('Delete functionality will be implemented');
    }, []);

    return { items, loading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
  };
};

export const useCateringItems = createHook<CateringItem>('catering');
export const useDecorItemsDB = createHook<DecorItem>('event-items');
export const useSanitationItems = createHook<SanitationItem>('sanitation_items');
export const useEntertainmentEquipment = createHook<EntertainmentItem>('entertainment_equipment');
export const useDJMCBookings = createHook<DJMCBooking>('djmc_bookings');