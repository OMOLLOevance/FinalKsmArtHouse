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

export const useCreatePaymentMutation = ({ onSuccess: customOnSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'user_id'>) => {
      return apiClient.post('/api/payments', payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
      if (customOnSuccess) {
        customOnSuccess();
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to record payment.';
      if (error.response?.data?.error) {
        const { formErrors, fieldErrors } = error.response.data.error;
        const messages: string[] = [];
        if (formErrors.length > 0) {
          messages.push(...formErrors);
        }
        for (const key in fieldErrors) {
          if (fieldErrors[key]) {
            messages.push(`${key}: ${fieldErrors[key].join(', ')}`);
          }
        }
        if (messages.length > 0) {
          errorMessage = `Validation failed: ${messages.join('; ')}`;
        }
      } else if (error.message) {
        errorMessage = `Failed to record payment: ${error.message}`;
      }
      toast.error(errorMessage);
    },
  });
};
