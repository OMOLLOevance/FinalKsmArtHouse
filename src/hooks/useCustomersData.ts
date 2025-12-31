// DEPRECATED: Use backend API instead of direct Supabase calls
// This file is kept for backward compatibility during migration

import { useState, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { safeLog } from '@/lib/sanitizer';

// MIGRATION NOTICE: Replace with backend API service
export const useCustomers = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (authLoading || !isAuthenticated || !userId) {
      setCustomers([]);
      setLoading(false);
      return { success: false, count: 0 };
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customers?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers');
      }
      
      setCustomers(result.data || []);
      setError(null);
      safeLog.info(`Fetched ${result.data?.length || 0} customers from database`);
      return { success: true, count: result.data?.length || 0 };
    } catch (err) {
      safeLog.error('Error fetching customers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...customer })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add customer');
      }
      
      await fetchCustomers();
      toast.success('Customer added successfully');
      return result.data;
    } catch (err) {
      safeLog.error('Error adding customer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add customer';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId, fetchCustomers]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    toast.info('Update functionality will be implemented');
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    toast.info('Delete functionality will be implemented');
  }, []);

  const combinedLoading = loading || authLoading;

  return { customers, loading: combinedLoading, error, syncing, addCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers };
};