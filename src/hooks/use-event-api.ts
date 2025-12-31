import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cateringService } from '@/services/catering.service';
import { eventItemsService } from '@/services/event-items.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Catering Hooks
export const useCateringItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering', 'items', userId],
    queryFn: () => cateringService.getCateringItems(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateCateringItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => cateringService.createCateringItem(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering', 'items'] });
      toast.success('Catering item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add catering item: ${error.message}`);
    },
  });
};

export const useCateringCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering', 'categories', userId],
    queryFn: () => cateringService.getCateringCategories(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
};

// Event Items Hooks
export const useEventItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event-items', userId],
    queryFn: () => eventItemsService.getEventItems(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEventItemsByCategoryQuery = (category: string) => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event-items', 'category', category, userId],
    queryFn: () => eventItemsService.getItemsByCategory(userId!, category),
    enabled: !!userId && isAuthenticated && !!category,
    retry: 3,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateEventItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => eventItemsService.createEventItem(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-items'] });
      toast.success('Event item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add event item: ${error.message}`);
    },
  });
};

export const useEventCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event-items', 'categories', userId],
    queryFn: () => eventItemsService.getEventCategories(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
};