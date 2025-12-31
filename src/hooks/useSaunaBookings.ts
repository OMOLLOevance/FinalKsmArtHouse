import { useState, useEffect } from 'react';
import { ensureAuthenticated, isAdmin as checkIsAdmin } from '../utils/authHelpers';
import { supabase } from '../lib/supabase';

export interface SaunaBooking {
  id: string;
  customer_name: string;
  phone: string;
  date: string;
  time_slot: string;
  service_type: string;
  amount_paid: number;
  status: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export const useSaunaBookings = () => {
  const [bookings, setBookings] = useState<SaunaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const user = await ensureAuthenticated();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      console.log('📥 Fetching sauna bookings for user:', user.email, 'Role:', user.role);

      // Use role from the logged-in user object (from custom_users table)
      const isAdmin = user.role === 'admin';

      let query = supabase
        .from('sauna_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        console.log('👤 User is not admin, filtering by user_id:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.log('👑 User is admin, fetching all sauna bookings');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log(`✅ Fetched ${data?.length || 0} sauna bookings`);
      setBookings(data || []);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching sauna bookings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('sauna_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sauna_bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addBooking = async (booking: Omit<SaunaBooking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await ensureAuthenticated();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sauna_bookings')
        .insert([{ ...booking, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding sauna booking:', err);
      throw err;
    }
  };

  const updateBooking = async (id: string, updates: Partial<SaunaBooking>) => {
    try {
      const { data, error } = await supabase
        .from('sauna_bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => prev.map(booking => booking.id === id ? data : booking));
      return data;
    } catch (err: any) {
      console.error('Error updating sauna booking:', err);
      throw err;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sauna_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== id));
    } catch (err: any) {
      console.error('Error deleting sauna booking:', err);
      throw err;
    }
  };

  return { bookings, loading, error, addBooking, updateBooking, deleteBooking, refetch: fetchBookings };
};
