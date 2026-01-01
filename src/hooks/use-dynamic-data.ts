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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCateringCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['catering', 'categories', userId],
    queryFn: () => cateringService.getCateringCategories(userId!),
    enabled: !!userId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCateringItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => cateringService.createCateringItem(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering'] });
      toast.success('Catering item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add catering item: ${error.message}`);
    },
  });
};

export const useUpdateCateringItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      cateringService.updateCateringItem(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering'] });
      toast.success('Catering item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update catering item: ${error.message}`);
    },
  });
};

export const useDeleteCateringItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => cateringService.deleteCateringItem(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering'] });
      toast.success('Catering item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete catering item: ${error.message}`);
    },
  });
};

// Event Items Hooks
export const useEventItemsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event', 'items', userId],
    queryFn: () => eventItemsService.getEventItems(userId!),
    enabled: !!userId && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEventItemsByCategoryQuery = (category: string) => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event', 'items', 'category', category, userId],
    queryFn: () => eventItemsService.getItemsByCategory(userId!, category),
    enabled: !!userId && isAuthenticated && !!category,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEventCategoriesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['event', 'categories', userId],
    queryFn: () => eventItemsService.getEventCategories(userId!),
    enabled: !!userId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateEventItemMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => eventItemsService.createEventItem(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
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
      queryClient.invalidateQueries({ queryKey: ['event'] });
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
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Event item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event item: ${error.message}`);
    },
  });
};

// Initialize default data hooks
export const useInitializeCateringMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering'] });
      toast.success('Default catering items initialized');
    },
    onError: (error: Error) => {
      toast.error(`Failed to initialize catering items: ${error.message}`);
    },
  });
};

export const useInitializeEventItemsMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Default event items initialized');
    },
    onError: (error: Error) => {
      toast.error(`Failed to initialize event items: ${error.message}`);
    },
  });
};