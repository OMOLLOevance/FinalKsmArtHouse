import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SaunaBooking, SpaBooking } from '../types';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface SaunaSpaFinance {
  id: string;
  date: string;
  type: 'sauna-profit' | 'spa-profit' | 'expense';
  description: string;
  amount: number;
  category: 'sauna' | 'spa' | 'general';
  user_id?: string;
}

export const useSaunaBookings = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<SaunaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setBookings([]);
        setError('User not authenticated');
        return;
      }

      const query = supabase
        .from('sauna_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sauna bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sauna bookings');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchBookings();
    }
  }, [fetchBookings, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('sauna_bookings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sauna_bookings', filter: `user_id=eq.${userId}` },
          () => {
            fetchBookings();
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchBookings, authLoading, userId]);

  const addBooking = useCallback(async (booking: Omit<SaunaBooking, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sauna_bookings')
        .insert([{ ...booking, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error adding sauna booking:', err);
      throw err;
    }
  }, [userId]);

  const updateBooking = useCallback(async (id: string, updates: Partial<SaunaBooking>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sauna_bookings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating sauna booking:', err);
      throw err;
    }
  }, [userId]);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sauna_bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (err) {
      console.error('Error deleting sauna booking:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { bookings, loading: combinedLoading, error, addBooking, updateBooking, deleteBooking, refetch: fetchBookings };
};

export const useSpaBookings = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<SpaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setBookings([]);
        setError('User not authenticated');
        return;
      }

      const query = supabase
        .from('spa_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching spa bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spa bookings');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchBookings();
    }
  }, [fetchBookings, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('spa_bookings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'spa_bookings', filter: `user_id=eq.${userId}` },
          () => {
            fetchBookings();
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchBookings, authLoading, userId]);

  const addBooking = useCallback(async (booking: Omit<SpaBooking, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('spa_bookings')
        .insert([{ ...booking, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error adding spa booking:', err);
      throw err;
    }
  }, [userId]);

  const updateBooking = useCallback(async (id: string, updates: Partial<SpaBooking>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('spa_bookings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating spa booking:', err);
      throw err;
    }
  }, [userId]);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('spa_bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (err) {
      console.error('Error deleting spa booking:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { bookings, loading: combinedLoading, error, addBooking, updateBooking, deleteBooking, refetch: fetchBookings };
};

export const useSaunaSpaFinances = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [finances, setFinances] = useState<SaunaSpaFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinances = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setFinances([]);
        setError('User not authenticated');
        return;
      }

      const query = supabase
        .from('sauna_spa_finances')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFinances(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sauna/spa finances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch finances');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchFinances();
    }
  }, [fetchFinances, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('sauna_spa_finances_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sauna_spa_finances', filter: `user_id=eq.${userId}` },
          (payload) => {
            fetchFinances();
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchFinances, authLoading, userId]);

  const addFinance = useCallback(async (finance: Omit<SaunaSpaFinance, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sauna_spa_finances')
        .insert([{ ...finance, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error adding finance:', err);
      throw err;
    }
  }, [userId]);

  const updateFinance = useCallback(async (id: string, updates: Partial<SaunaSpaFinance>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sauna_spa_finances')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating finance:', err);
      throw err;
    }
  }, [userId]);

  const deleteFinance = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sauna_spa_finances')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (err) {
      console.error('Error deleting finance:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { finances, loading: combinedLoading, error, addFinance, updateFinance, deleteFinance, refetch: fetchFinances };
};