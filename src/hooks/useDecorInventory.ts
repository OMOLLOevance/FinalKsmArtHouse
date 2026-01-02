import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface DecorInventoryItem {
  id: string;
  category: string;
  item_name: string;
  in_store: number;
  hired: number;
  damaged: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export const useDecorInventoryQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['decor-inventory', userId],
    queryFn: async (): Promise<DecorInventoryItem[]> => {
      const { data, error } = await supabase
        .from('decor_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) {
        logger.error('Decor inventory fetch error:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDecorCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['decor-categories', userId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('decor_inventory')
        .select('category')
        .eq('user_id', userId);

      if (error) {
        logger.error('Decor categories fetch error:', error);
        throw error;
      }

      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories;
    },
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateDecorInventoryMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DecorInventoryItem> }) => {
      const { data, error } = await supabase
        .from('decor_inventory')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      toast.success('Inventory updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update inventory: ${error.message}`);
    },
  });
};

export const useDecorActionMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'hire' | 'return' | 'damage' | 'repair' }) => {
      // First get current values
      const { data: current, error: fetchError } = await supabase
        .from('decor_inventory')
        .select('in_store, hired, damaged')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      let updates: Partial<DecorInventoryItem> = {};

      switch (action) {
        case 'hire':
          if (current.in_store <= 0) throw new Error('No items available to hire');
          updates = { in_store: current.in_store - 1, hired: current.hired + 1 };
          break;
        case 'return':
          if (current.hired <= 0) throw new Error('No items to return');
          updates = { hired: current.hired - 1, in_store: current.in_store + 1 };
          break;
        case 'damage':
          if (current.in_store <= 0) throw new Error('No items available to damage');
          updates = { in_store: current.in_store - 1, damaged: current.damaged + 1 };
          break;
        case 'repair':
          if (current.damaged <= 0) throw new Error('No damaged items to repair');
          updates = { damaged: current.damaged - 1, in_store: current.in_store + 1 };
          break;
      }

      const { data, error } = await supabase
        .from('decor_inventory')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      toast.success(`Item ${action}d successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useAddDecorItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemData: { category: string; item_name: string; in_store: number; price: number }) => {
      const { data, error } = await supabase
        .from('decor_inventory')
        .insert({
          user_id: userId,
          ...itemData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['decor-categories'] });
      toast.success('Item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
};