import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  created_at: string;
  user_id: string;
  quotation_id: string;
  customer_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

export const usePaymentsQuery = (quotationId?: string) => {
  const { userId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['payments', quotationId],
    queryFn: async (): Promise<Payment[]> => {
      let url = '/api/payments';
      if (quotationId) {
        url += `?quotationId=${quotationId}`;
      }
      const response = await apiClient.get<{ data: Payment[] }>(url);
      return response.data;
    },
    enabled: !!userId && isAuthenticated && !!quotationId,
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
      toast.error(`Failed to record payment: ${error.message || 'Unknown error'}`);
    },
  });
};
