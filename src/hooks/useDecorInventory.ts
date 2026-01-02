import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      const response = await apiClient.get<{ data: DecorInventoryItem[] }>(`/api/decor-inventory?userId=${userId}`);
      return response.data;
    },
    enabled: isAuthenticated,
  });
};

export const useDecorCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['decor-categories', userId],
    queryFn: async (): Promise<string[]> => {
      const response = await apiClient.get<{ data: DecorInventoryItem[] }>(`/api/decor-inventory?userId=${userId}`);
      const categories = [...new Set(response.data.map(item => item.category))];
      return categories;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateDecorInventoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DecorInventoryItem> }) => {
      const response = await apiClient.put<{ data: DecorInventoryItem }>('/api/decor-inventory', { id, ...updates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      toast.success('Inventory updated successfully');
    },
  });
};

export const useDecorActionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'hire' | 'return' | 'damage' | 'repair' }) => {
      const response = await apiClient.post<{ data: DecorInventoryItem }>('/api/decor-inventory', { id, action });
      return response.data;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      toast.success(`Item ${action}d successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Action failed');
    },
  });
};

export const useAddDecorItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemData: { category: string; item_name: string; in_store: number; price: number }) => {
      const response = await apiClient.post<{ data: DecorInventoryItem }>('/api/decor-inventory', {
        ...itemData,
        user_id: userId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['decor-categories'] });
      toast.success('Item added successfully');
    },
  });
};