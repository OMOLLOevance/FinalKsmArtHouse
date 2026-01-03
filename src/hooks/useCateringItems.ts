import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { CateringItem } from '../types';
import { toast } from 'sonner';

export const useCateringItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering-items', userId],
    queryFn: async (): Promise<CateringItem[]> => {
      const response = await apiClient.get<{ data: CateringItem[] }>(`/api/catering?userId=${userId}`);
      return response.data;
    },
    enabled: !!userId && isAuthenticated,
  });
};

export const useCreateCateringItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<CateringItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      return apiClient.post('/api/catering', { ...item, user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-items'] });
      toast.success('Service item added');
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useUpdateCateringItemMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CateringItem> }) => {
      return apiClient.put('/api/catering', { id, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-items'] });
      toast.success('Service item updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useDeleteCateringItemMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/catering?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-items'] });
      toast.success('Service item removed');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove item: ${error.message || 'Unknown error'}`);
    },
  });
};

// Legacy Wrapper for CateringManager
export const useCateringItems = () => {
  const query = useCateringItemsQuery();
  const createMutation = useCreateCateringItemMutation();
  const updateMutation = useUpdateCateringItemMutation();
  const deleteMutation = useDeleteCateringItemMutation();

  return {
    items: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    addItem: createMutation.mutateAsync,
    updateItem: (id: string, updates: Partial<CateringItem>) => updateMutation.mutateAsync({ id, updates }),
    deleteItem: deleteMutation.mutateAsync,
    refetch: () => query.refetch(),
  };
};