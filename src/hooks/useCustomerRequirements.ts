import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CustomerRequirement {
  id: string;
  customer_id: string;
  decor_item_id: string;
  quantity_required: number;
  status: 'pending' | 'confirmed' | 'delivered';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  item_name?: string;
  item_category?: string;
  item_price?: number;
}

export const useCustomerRequirementsQuery = (customerId?: string) => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['customer-requirements', userId, customerId],
    queryFn: async (): Promise<CustomerRequirement[]> => {
      const customerParam = customerId ? `&customerId=${customerId}` : '';
      const response = await apiClient.get<{ data: any[] }>(`/api/customer-requirements?userId=${userId}${customerParam}`);
      
      return (response.data || []).map(item => ({
        ...item,
        customer_name: item.customers?.name || 'Unknown',
        item_name: item.decor_inventory?.item_name || 'Unknown',
        item_category: item.decor_inventory?.category || 'N/A',
        item_price: Number(item.decor_inventory?.price || 0),
      }));
    },
    enabled: !!userId && isAuthenticated,
    retry: 1,
    staleTime: 30 * 1000,
  });
};

export const useAddItemToCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, decorItemId, quantity = 1 }: { 
      customerId: string; 
      decorItemId: string; 
      quantity?: number; 
    }) => {
      return apiClient.post('/api/customer-requirements', {
        user_id: userId,
        customer_id: customerId,
        decor_item_id: decorItemId,
        quantity_required: quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Item added to customer requirements');
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useUpdateCustomerRequirementMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<CustomerRequirement>; 
    }) => {
      return apiClient.put('/api/customer-requirements', { id, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Requirement updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update requirement: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useRemoveCustomerRequirementMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/customer-requirements?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Item removed from requirements');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove item: ${error.message || 'Unknown error'}`);
    },
  });
};
