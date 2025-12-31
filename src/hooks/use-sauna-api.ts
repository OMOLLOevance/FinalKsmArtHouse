import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saunaService } from '@/services/sauna.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Sauna Bookings Hooks
export const useSaunaBookingsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['sauna', 'bookings', userId],
    queryFn: () => saunaService.getSaunaBookings(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
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

// Spa Bookings Hooks
export const useSpaBookingsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['spa', 'bookings', userId],
    queryFn: () => saunaService.getSpaBookings(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSpaBookingMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => saunaService.createSpaBooking(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spa', 'bookings'] });
      toast.success('Spa booking added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add spa booking: ${error.message}`);
    },
  });
};

// Sauna Finances Hooks
export const useSaunaFinancesQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['sauna', 'finances', userId],
    queryFn: () => saunaService.getSaunaFinances(userId!),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSaunaFinanceMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => saunaService.createSaunaFinance(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sauna', 'finances'] });
      toast.success('Finance record added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add finance record: ${error.message}`);
    },
  });
};