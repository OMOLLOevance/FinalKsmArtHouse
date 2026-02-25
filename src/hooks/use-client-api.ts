
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface IClientForm {
  id?: string;
  date: string;
  accountManager: string;
  clientName: string;
  location: string;
  numberOfParks: number;
  phoneNumber: string;
  typeOfEvents: string;
  status: 'confirmed' | 'no-feedback' | 'under-discussion';
  user_id?: string;
}

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<IClientForm[]> => {
      const response = await apiClient.get<{ data: any[] }>('/api/clients');
      const data = response.data || [];
      
      return data.map(client => ({
        id: client.id,
        date: client.date,
        accountManager: client.account_manager,
        clientName: client.client_name,
        location: client.location,
        numberOfParks: client.number_of_parks,
        phoneNumber: client.phone_number,
        typeOfEvents: client.type_of_events,
        status: client.status,
        user_id: client.user_id,
      }));
    },
  });
};

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: IClientForm) => {
      return apiClient.post('/api/clients', {
        date: data.date,
        account_manager: data.accountManager,
        client_name: data.clientName,
        location: data.location,
        number_of_parks: data.numberOfParks,
        phone_number: data.phoneNumber,
        type_of_events: data.typeOfEvents,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client added successfully');
    },
    onError: (error: any) => {
      toast.error(`Error adding client: ${error.message || 'Unknown error'}`);
    }
  });
};

export const useUpdateClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: IClientForm['status'] }) => {
      return apiClient.put('/api/clients', { id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client status updated');
    },
    onError: (error: any) => {
      toast.error(`Error updating client: ${error.message || 'Unknown error'}`);
    }
  });
};

export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/clients?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted');
    },
    onError: (error: any) => {
      toast.error(`Error deleting client: ${error.message || 'Unknown error'}`);
    }
  });
};
