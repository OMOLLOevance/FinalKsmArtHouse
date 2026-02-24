import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRoleGuard } from '@/hooks/useRoleGuard';

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

export const usePaymentsQuery = (itemId?: string, serviceType?: 'quotation' | 'gym' | 'sauna', filterUserId?: string | null) => {
  const { userId, isAuthenticated } = useAuth();
  const { isManager } = useRoleGuard();

  return useQuery({
    queryKey: ['payments', itemId, serviceType, filterUserId],
    queryFn: async (): Promise<Payment[]> => {
      const params = new URLSearchParams();
      
      if (itemId && serviceType) {
        const paramMap = {
          quotation: 'quotationId',
          gym: 'gymMemberId',
          sauna: 'saunaBookingId'
        };
        params.append(paramMap[serviceType], itemId);
      }

      if (filterUserId) {
        params.append('filterUserId', filterUserId);
      } else if (isManager()) {
        params.append('discovery', 'true');
      }

      const url = `/api/payments?${params.toString()}`;
      const response = await apiClient.get<{ data: Payment[] }>(url);
      return response.data;
    },
    enabled: !!userId && isAuthenticated && !!itemId && !!serviceType,
  });
};

export const useAllPaymentsQuery = (month?: string, year?: string, filterUserId?: string | null) => {
  const { userId, isAuthenticated } = useAuth();
  const { isManager } = useRoleGuard();

  return useQuery({
    queryKey: ['payments', 'all', month, year, filterUserId],
    queryFn: async (): Promise<Payment[]> => {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      if (filterUserId) {
        params.append('filterUserId', filterUserId);
      } else if (isManager()) {
        params.append('discovery', 'true');
      }

      const url = `/api/payments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<{ data: Payment[] }>(url);
      return response.data;
    },
    enabled: !!userId && isAuthenticated,
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
      
      const errorData = error.response?.data?.error;
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.fieldErrors) {
        // Handle Zod flattened error if necessary
        const messages: string[] = [];
        for (const key in errorData.fieldErrors) {
          if (errorData.fieldErrors[key]) {
            messages.push(`${key}: ${errorData.fieldErrors[key].join(', ')}`);
          }
        }
        if (messages.length > 0) {
          errorMessage = messages.join('; ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });
};
