import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { MasterInventoryItem } from '@/types';

export const useRestaurantMasterItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();

  return useQuery<MasterInventoryItem[]>({
    queryKey: ['restaurantMasterItems'],
    queryFn: async (): Promise<MasterInventoryItem[]> => {
      const response = await apiClient.get<{ data: MasterInventoryItem[] }>('/api/restaurant/master-items');
      return response.data;
    },
    enabled: !!userId && isAuthenticated, // Only fetch if user is authenticated
    staleTime: Infinity, // Master items list doesn't change often
  });
};
