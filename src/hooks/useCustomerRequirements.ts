import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
      let query = supabase
        .from('customer_requirements')
        .select(`
          *,
          customers (name),
          decor_inventory (item_name, category, price)
        `)
        .eq('user_id', userId);

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('Customer requirements fetch error:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        customer_name: item.customers?.name,
        item_name: item.decor_inventory?.item_name,
        item_category: item.decor_inventory?.category,
        item_price: item.decor_inventory?.price,
      }));
    },
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
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
      // Check if item already exists for this customer
      const { data: existing } = await supabase
        .from('customer_requirements')
        .select('id, quantity_required')
        .eq('customer_id', customerId)
        .eq('decor_item_id', decorItemId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update quantity if item already exists
        const { data, error } = await supabase
          .from('customer_requirements')
          .update({ 
            quantity_required: existing.quantity_required + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Add new requirement
        const { data, error } = await supabase
          .from('customer_requirements')
          .insert({
            user_id: userId,
            customer_id: customerId,
            decor_item_id: decorItemId,
            quantity_required: quantity,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Item added to customer requirements');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Item already added to this customer');
      } else {
        toast.error(`Failed to add item: ${error.message}`);
      }
    },
  });
};

export const useUpdateCustomerRequirementMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<CustomerRequirement>; 
    }) => {
      const { data, error } = await supabase
        .from('customer_requirements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Requirement updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update requirement: ${error.message}`);
    },
  });
};

export const useRemoveCustomerRequirementMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_requirements')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-requirements'] });
      toast.success('Item removed from requirements');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
};