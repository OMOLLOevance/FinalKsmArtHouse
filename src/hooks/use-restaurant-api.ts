import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Restaurant Sales Hooks
export const useRestaurantSalesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['restaurant', 'sales', userId],
    queryFn: () => restaurantService.getRestaurantSales(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateRestaurantSaleMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => restaurantService.createRestaurantSale(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', 'sales'] });
      toast.success('Restaurant sale added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add restaurant sale: ${error.message}`);
    },
  });
};