import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  created_at: string;
  user_id: string;
  quotation_id?: string;
  customer_id?: string;
  gym_member_id?: string;
  sauna_booking_id?: string;
  service_type: 'quotation' | 'gym' | 'sauna';
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

export const usePaymentsQuery = (itemId?: string, serviceType?: 'quotation' | 'gym' | 'sauna') => {
  const { userId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['payments', itemId, serviceType],
    queryFn: async (): Promise<Payment[]> => {
      let url = '/api/payments';
      if (itemId && serviceType) {
        const paramMap = {
          quotation: 'quotationId',
          gym: 'gymMemberId',
          sauna: 'saunaBookingId'
        };
        url += `?${paramMap[serviceType]}=${itemId}`;
      }
      const response = await apiClient.get<{ data: Payment[] }>(url);
      return response.data;
    },
    enabled: !!userId && isAuthenticated && !!itemId && !!serviceType,
  });
};

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'user_id'>) => {
      return apiClient.post('/api/payments', payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      if (error.response?.data?.details) {
        const errorMessages = error.response.data.details.map((detail: any) => detail.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(`Failed to record payment: ${error.message || 'Unknown error'}`);
      }
    },
  });
};
