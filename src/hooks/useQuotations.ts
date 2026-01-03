import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  remarks: string;
}

export interface QuotationSection {
  name: string;
  items: QuotationItem[];
}

export interface AdditionalCharges {
  cateringLabour: number;
  serviceCharge: number;
  transport: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfGuests: number;
  theme: string;
  eventDate: string;
  eventType: string;
  customEventType: string;
  quotationType: 'event' | 'food';
  sections: QuotationSection[];
  grandTotal: number;
  additionalCharges: AdditionalCharges;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  notes: string;
}

export const useQuotationsQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['quotations', userId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[] }>(`/api/quotations?userId=${userId}`);
      // Map API snake_case to Frontend camelCase
      return response.data.map(q => ({
        id: q.id,
        quotationNumber: q.id ? `QT-${q.id.slice(-6)}` : 'QT-NEW',
        customerName: q.customer_name || 'Unnamed Client',
        customerEmail: q.customer_email || '',
        customerPhone: q.customer_phone || '',
        numberOfGuests: q.number_of_guests || 0,
        theme: q.theme || '',
        eventDate: q.event_date || '',
        eventType: q.event_type || '',
        customEventType: q.custom_event_type || '',
        quotationType: q.quotation_type === 'Event/Decor' ? 'event' : 'food',
        sections: q.sections || [],
        grandTotal: Number(q.total_amount || 0),
        additionalCharges: q.additional_charges || { cateringLabour: 0, serviceCharge: 0, transport: 0 },
        status: q.status || 'draft',
        createdAt: q.created_at || new Date().toISOString(),
        notes: q.notes || '',
      })) as Quotation[];
    },
    enabled: !!userId && isAuthenticated,
  });
};

export const useCreateQuotationMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/api/quotations', { ...data, user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation created');
    },
  });
};

export const useUpdateQuotationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiClient.put('/api/quotations', { id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation updated');
    },
  });
};

export const useDeleteQuotationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/quotations?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation deleted');
    },
  });
};

// Legacy Wrapper for QuotationManager
export const useQuotations = () => {
  const query = useQuotationsQuery();
  const createMutation = useCreateQuotationMutation();
  const updateMutation = useUpdateQuotationMutation();
  const deleteMutation = useDeleteQuotationMutation();

  return {
    quotations: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    fetchQuotations: () => query.refetch(),
    createQuotation: createMutation.mutateAsync,
    updateQuotation: (id: string, data: any) => updateMutation.mutateAsync({ id, data }),
    deleteQuotation: deleteMutation.mutateAsync,
  };
};