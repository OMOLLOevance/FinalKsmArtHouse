import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DecorAllocation {
  id: string;
  customer_name: string;
  month: number;
  year: number;
  row_number: number;
  walkway_stands: number;
  arc: number;
  aisle_stands: number;
  photobooth: number;
  lecturn: number;
  stage_boards: number;
  backdrop_boards: number;
  dance_floor: number;
  walkway_boards: number;
  white_sticker: number;
  centerpieces: number;
  glass_charger_plates: number;
  melamine_charger_plates: number;
  african_mats: number;
  gold_napkin_holders: number;
  silver_napkin_holders: number;
  roof_top_decor: number;
  parcan_lights: number;
  revolving_heads: number;
  fairy_lights: number;
  snake_lights: number;
  neon_lights: number;
  small_chandeliers: number;
  large_chandeliers: number;
  african_lampshades: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useDecorAllocationsQuery = (month: number, year: number) => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['decor-allocations', month, year, userId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: DecorAllocation[] }>(
        `/api/decor-allocations?userId=${userId}&month=${month}&year=${year}`
      );
      return response.data;
    },
    enabled: !!userId && isAuthenticated,
  });
};

export const useUpsertDecorAllocationMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (allocation: Partial<DecorAllocation>) => {
      const response = await apiClient.post<{ data: DecorAllocation }>('/api/decor-allocations', {
        ...allocation,
        user_id: userId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['decor-allocations', data.month - 1, data.year] 
      });
    },
    onError: (error: any) => {
      console.error('Error upserting decor allocation:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    },
  });
};

// Legacy support if needed, but recommended to use useUpsertDecorAllocationMutation
export const useSaveDecorAllocationsMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      allocations, 
      month, 
      year 
    }: { 
      allocations: Partial<DecorAllocation>[], 
      month: number, 
      year: number 
    }) => {
      // For batch saves, we'll process them sequentially or update API to handle arrays
      const results = await Promise.all(
        allocations.map(a => apiClient.post<{ data: DecorAllocation }>('/api/decor-allocations', {
          ...a,
          month: month + 1,
          year,
          user_id: userId
        }))
      );
      return results.map(r => r.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['decor-allocations', variables.month, variables.year] 
      });
      toast.success('Decor allocations updated');
    },
  });
};