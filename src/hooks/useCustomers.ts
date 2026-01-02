import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_date: string;
  event_type: string;
  venue: string;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_cost: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyAllocation {
  id: string;
  customer_id: string;
  date: string;
  location: string;
  customer_name: string;
  tent_size: string;
  table_count: number;
  seat_type: string;
  total_ksh: number;
  month: number;
  year: number;
}

export interface DecorItem {
  id: string;
  customer_id: string;
  customer_name: string;
  walkway_stands: number;
  arc: number;
  aisle_stands: number;
  photobooth: number;
  lecturn: number;
  stage_boards: number;
  backdrop_boards: number;
  dance_floor: number;
  walkway_boards: number;
  centerpieces: number;
  charger_plates: number;
  african_mats: number;
  napkin_holders: number;
  roof_top_decor: number;
  lighting_items: number;
  chandeliers: number;
  african_lampshades: number;
}

export const useCustomersQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['customers', userId],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Customers fetch error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
};

export const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
};

export const useMonthlyAllocationsQuery = (month: number, year: number) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-allocations', month, year],
    queryFn: async (): Promise<MonthlyAllocation[]> => {
      const { data, error } = await supabase
        .from('monthly_allocations')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('date', { ascending: true });

      if (error) {
        logger.error('Monthly allocations fetch error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDecorItemsQuery = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['decor-items'],
    queryFn: async (): Promise<DecorItem[]> => {
      const { data, error } = await supabase
        .from('decor_items')
        .select('*')
        .order('customer_name', { ascending: true });

      if (error) {
        logger.error('Decor items fetch error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSyncDataMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Trigger refetch of all customer-related data
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['monthly-allocations'] });
      await queryClient.invalidateQueries({ queryKey: ['decor-items'] });
      return true;
    },
    onSuccess: () => {
      toast.success('Data synchronized across all devices');
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync data: ${error.message}`);
    },
  });
};

export const useCustomers = () => {
  const customersQuery = useCustomersQuery();
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const deleteMutation = useDeleteCustomerMutation();
  const syncMutation = useSyncDataMutation();

  return {
    customers: customersQuery.data,
    loading: customersQuery.isLoading,
    error: customersQuery.error,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: (id: string, updates: Partial<Customer>) => 
      updateMutation.mutateAsync({ id, updates }),
    deleteCustomer: deleteMutation.mutateAsync,
    syncData: syncMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSyncing: syncMutation.isPending,
  };
};