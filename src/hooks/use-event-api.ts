import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cateringService } from '@/services/catering.service';
import { eventItemsService } from '@/services/event-items.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';


// Catering Hooks
export const useCateringItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering', 'items', userId],
    queryFn: () => cateringService.getCateringItems(userId!).catch(err => {
      logger.error('Catering items fetch error:', err);
      return [];
    }),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
// ...
export const useEventItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event-items', userId],
    queryFn: () => eventItemsService.getEventItems(userId!).catch(err => {
      logger.error('Event items fetch error:', err);
      return [];
    }),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
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

export const useUpdateEventItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      eventItemsService.updateEventItem(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-items'] });
      toast.success('Event item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update event item: ${error.message}`);
    },
  });
};

export const useDeleteEventItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => eventItemsService.deleteEventItem(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-items'] });
      toast.success('Event item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event item: ${error.message}`);
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
