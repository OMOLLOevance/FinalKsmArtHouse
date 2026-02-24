import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CustomerDataRecord {
  id: string;
  user_id: string;
  created_at: string;
  event_date: string;
  location: string;
  name: string;
  requirements: Record<string, number>;
}

export const useCustomerDataSync = (month?: number | 'all', year?: number) => {
  const { userId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customer-data-records', userId, month, year],
    queryFn: async (): Promise<CustomerDataRecord[]> => {
      let url = '/api/customers?discovery=true';
      const params = new URLSearchParams();
      
      if (month !== undefined && month !== 'all' && year) {
        // API expects 1-indexed month
        params.append('month', (Number(month) + 1).toString());
        params.append('year', year.toString());
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      
      const response = await apiClient.get<{ data: any[] }>(url);
      
      return (response.data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        created_at: item.created_at,
        event_date: item.event_date || '',
        location: item.location || '',
        name: item.name || '',
        requirements: item.requirements || {}
      }));
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (record: Omit<CustomerDataRecord, 'id' | 'created_at' | 'user_id'>) => {
      return apiClient.post('/api/customers', {
        name: record.name,
        event_date: record.event_date,
        location: record.location,
        requirements: record.requirements,
        user_id: userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-data-records'] });
      toast.success('Customer data saved successfully');
    },
    onError: (error: any) => {
      logger.error('Failed to save customer data:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: Partial<CustomerDataRecord> & { id: string }) => {
      return apiClient.put('/api/customers', {
        id,
        name: record.name,
        event_date: record.event_date,
        location: record.location,
        requirements: record.requirements
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-data-records'] });
      toast.success('Record updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/customers?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-data-records'] });
      toast.success('Record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  });

  return {
    records: customersQuery.data || [],
    isLoading: customersQuery.isLoading,
    isError: customersQuery.isError,
    createRecord: createMutation.mutateAsync,
    updateRecord: updateMutation.mutateAsync,
    deleteRecord: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};
