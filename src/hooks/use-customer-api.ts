import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export const useCustomersQuery = (month?: number | 'all', year?: number) => {
  const { userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isManager } = useRoleGuard();
  
  return useQuery({
    queryKey: ['customers-combined', userId, month, year],
    queryFn: async () => {
      try {
        const isManagement = isManager();
        
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (isManagement) params.append('discovery', 'true');
        
        if (month !== undefined && month !== 'all' && year) {
          // Hooks receive 0-indexed month from UI, but standardized API expects 1-indexed (1-12)
          const monthNum = typeof month === 'number' ? month + 1 : parseInt(month) + 1;
          params.append('month', monthNum.toString());
          params.append('year', year.toString());
        }
        
        const url = `/api/customers?${params.toString()}`;
          
        const response = await apiClient.get<{ data: any[] }>(url);
        return response.data || [];
      } catch (err) {
        logger.error('Customers combined fetch error:', err);
        return [];
      }
    },
    enabled: !!userId && isAuthenticated && !authLoading,
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
