// DEPRECATED: Use React Query hooks from use-sauna-api.ts instead
// This file is kept for backward compatibility during migration

import { useState, useEffect, useCallback } from 'react';
import { SaunaBooking, SpaBooking } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { safeLog } from '@/lib/sanitizer';

interface SaunaSpaFinance {
  id: string;
  date: string;
  type: 'sauna-profit' | 'spa-profit' | 'expense';
  description: string;
  amount: number;
  category: 'sauna' | 'spa' | 'general';
  user_id?: string;
}

// MIGRATION NOTICE: Replace with useSaunaBookingsQuery from @/hooks/use-sauna-api
export const useSaunaBookings = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<SaunaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use backend API instead of direct Supabase
      const response = await fetch(`/api/sauna?userId=${userId}&type=bookings`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }
      
      setBookings(result.data || []);
      setError(null);
    } catch (err) {
      safeLog.error('Error fetching sauna bookings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sauna bookings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const addBooking = useCallback(async (booking: Omit<SaunaBooking, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/sauna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'bookings', ...booking })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add booking');
      }
      
      await fetchBookings();
      toast.success('Sauna booking added successfully');
      return result.data;
    } catch (err) {
      safeLog.error('Error adding sauna booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add booking';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId, fetchBookings]);

  const updateBooking = useCallback(async (id: string, updates: Partial<SaunaBooking>) => {
    // Implementation for update via API
    toast.info('Update functionality will be implemented');
  }, []);

  const deleteBooking = useCallback(async (id: string) => {
    // Implementation for delete via API
    toast.info('Delete functionality will be implemented');
  }, []);

  return { bookings, loading, error, addBooking, updateBooking, deleteBooking, refetch: fetchBookings };
};

// MIGRATION NOTICE: Replace with useSpaBookingsQuery from @/hooks/use-sauna-api
export const useSpaBookings = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<SpaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sauna?userId=${userId}&type=spa`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch spa bookings');
      }
      
      setBookings(result.data || []);
      setError(null);
    } catch (err) {
      safeLog.error('Error fetching spa bookings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch spa bookings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const addBooking = useCallback(async (booking: Omit<SpaBooking, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/sauna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'spa', ...booking })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add spa booking');
      }
      
      await fetchBookings();
      toast.success('Spa booking added successfully');
      return result.data;
    } catch (err) {
      safeLog.error('Error adding spa booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add spa booking';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId, fetchBookings]);

  const updateBooking = useCallback(async (id: string, updates: Partial<SpaBooking>) => {
    toast.info('Update functionality will be implemented');
  }, []);

  const deleteBooking = useCallback(async (id: string) => {
    toast.info('Delete functionality will be implemented');
  }, []);

  return { bookings, loading, error, addBooking, updateBooking, deleteBooking, refetch: fetchBookings };
};

// MIGRATION NOTICE: Replace with useSaunaFinancesQuery from @/hooks/use-sauna-api
export const useSaunaSpaFinances = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [finances, setFinances] = useState<SaunaSpaFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinances = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) {
      setFinances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sauna?userId=${userId}&type=finances`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch finances');
      }
      
      setFinances(result.data || []);
      setError(null);
    } catch (err) {
      safeLog.error('Error fetching sauna/spa finances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch finances';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const addFinance = useCallback(async (finance: Omit<SaunaSpaFinance, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/sauna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'finances', ...finance })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add finance record');
      }
      
      await fetchFinances();
      toast.success('Finance record added successfully');
      return result.data;
    } catch (err) {
      safeLog.error('Error adding finance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add finance record';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId, fetchFinances]);

  const updateFinance = useCallback(async (id: string, updates: Partial<SaunaSpaFinance>) => {
    toast.info('Update functionality will be implemented');
  }, []);

  const deleteFinance = useCallback(async (id: string) => {
    toast.info('Delete functionality will be implemented');
  }, []);

  return { finances, loading, error, addFinance, updateFinance, deleteFinance, refetch: fetchFinances };
};