import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saunaService } from '@/services/sauna.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';


// Sauna Bookings Hooks
export const useSaunaBookingsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['sauna', 'bookings', userId],
    queryFn: () => saunaService.getSaunaBookings(userId!).catch(err => {
      logger.error('Sauna bookings fetch error:', err);
      return [];
    }),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useCreateSaunaBookingMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => saunaService.createSaunaBooking(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sauna', 'bookings'] });
      toast.success('Sauna booking added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add sauna booking: ${error.message}`);
    },
  });
};

export const useUpdateSaunaBookingMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      saunaService.updateSaunaBooking(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sauna', 'bookings'] });
      toast.success('Sauna booking updated');
    },
  });
};

export const useDeleteSaunaBookingMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => saunaService.deleteSaunaBooking(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sauna', 'bookings'] });
      toast.success('Sauna booking deleted');
    },
  });
};
