import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export const useCustomersQuery = () => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth(); // Add authLoading
  const { isDirectorOrInvestor, isOperationsManager } = useRoleGuard();
  
  return useQuery({
    queryKey: ['customers-combined', userId],
    queryFn: async () => {
      try {
        const isManagement = isDirectorOrInvestor() || isOperationsManager();
        
        // Use the discovery API for management, or standard user filter for staff
        const url = isManagement 
          ? `/api/customers?userId=${userId}&discovery=true` 
          : `/api/customers?userId=${userId}`;
          
        const response = await apiClient.get<{ data: any[] }>(url);
        return response.data || [];
      } catch (err) {
        logger.error('Customers combined fetch error:', err);
        return [];
      }
    },
    enabled: !!userId && isAuthenticated && !authLoading, // ADD !authLoading
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useCreateCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => customerService.createCustomer(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      customerService.updateCustomer(userId!, id, data),
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
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
};
