import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { getAuthenticatedUser } from '../utils/authHelpers'; // Use getAuthenticatedUser for admin check

export const useCustomers = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth(); // Consume AuthContext
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (authLoading) return { success: false, count: 0 }; // Don't fetch if auth is still loading

    try {
      setLoading(true); // Start loading here
      if (!isAuthenticated || !userId) {
        // If not authenticated, try to load from local storage
        const localData = localStorage.getItem('customers');
        if (localData) {
          setCustomers(JSON.parse(localData));
        }
        setError('User not authenticated');
        return { success: false, count: 0 };
      }

      // Instead of checkIsAdmin (which relies on localStorage), get user info from context
      // And check role directly
      const userIsAdmin = user?.role === 'admin';

      const query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCustomers(data || []);
      localStorage.setItem('customers', JSON.stringify(data || []));
      setError(null);
      console.log(`✅ Fetched ${data?.length || 0} customers from database`);
      return { success: true, count: data?.length || 0 };
    } catch (err) {
      console.error('Error fetching customers:', err);
      const localData = localStorage.getItem('customers');
      if (localData) {
        setCustomers(JSON.parse(localData));
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, isAuthenticated, user, authLoading]); // Add auth-related dependencies

  useEffect(() => {
    // Only fetch if auth is not loading and userId state is stable
    if (!authLoading) {
      fetchCustomers();
    }
  }, [fetchCustomers, authLoading]);

  // Realtime subscription setup
  useEffect(() => {
    if (!authLoading && userId) { // Only setup if auth is done loading and user is present
      const setupRealtimeSubscription = async () => {
        const channel = supabase
          .channel('customers_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'customers'
            },
            () => {
              fetchCustomers();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };
      setupRealtimeSubscription();
    }
  }, [fetchCustomers, authLoading, userId]); // Add userId to dependency

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          user_id: userId, // Use userId from context
          name: customer.name,
          contact: customer.contact,
          location: customer.location,
          event_type: customer.eventType,
          event_date: customer.eventDate,
          total_amount: customer.totalAmount,
          paid_amount: customer.paidAmount,
          payment_status: customer.paymentStatus,
          payment_method: customer.paymentMethod,
          service_status: customer.serviceStatus,
          notes: customer.notes,
          requirements: customer.requirements
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => {
        const updated = [data, ...prev];
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });
      return data;
    } catch (err) {
      console.error('Error adding customer:', err);
      throw err;
    }
  }, [userId]); // Add userId dependency

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure only own data can be updated
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => {
        const updated = prev.map(c => c.id === id ? data : c);
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });
      return data;
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }, [userId]); // Add userId dependency

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure only own data can be deleted

      if (error) throw error;

      setCustomers(prev => {
        const updated = prev.filter(c => c.id !== id);
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, [userId]); // Add userId dependency

  // Combine loading states
  const combinedLoading = loading || authLoading;

  return { customers, loading: combinedLoading, error, syncing, addCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers };
};