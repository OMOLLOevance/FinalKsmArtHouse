import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CateringInventoryItem {
  id: string;
  category: string;
  particular: string;
  good_condition: number;
  repair_needed: number;
  user_id: string;
}

export const useCateringInventoryQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering-inventory', userId],
    queryFn: async (): Promise<CateringInventoryItem[]> => {
      const response = await apiClient.get<{ data: CateringInventoryItem[] }>(`/api/catering-inventory?userId=${userId}`);
      return response.data;
    },
    enabled: !!userId && isAuthenticated,
  });
};

export const useUpsertCateringInventoryMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<CateringInventoryItem>) => {
      return apiClient.post('/api/catering-inventory', { ...item, user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory'] });
    },
  });
};

export const useDeleteCateringInventoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/catering-inventory?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory'] });
      toast.success('Item removed from inventory');
    },
  });
};
