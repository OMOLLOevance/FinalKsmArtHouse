import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';


import { supabase } from '@/lib/supabase';

export const useCustomersQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['customers-combined', userId],
    queryFn: async () => {
      try {
        // Fetch from regular customers table
        const customersRes = await customerService.getCustomers(userId!).catch(() => []);
        
        // Fetch from monthly allocations table
        const { data: allocations, error } = await supabase
          .from('monthly_allocations')
          .select('id, customer_name, event_type, event_date, location, phone_number, total_ksh, deposit_paid, status')
          .eq('user_id', userId);
        
        if (error) throw error;

        // Map allocations to match customer structure
        const mappedAllocations = (allocations || []).map(a => ({
          id: a.id,
          name: a.customer_name,
          contact: a.phone_number || 'N/A',
          location: a.location || 'N/A',
          eventType: a.event_type || 'Event',
          eventDate: a.event_date || '',
          totalAmount: Number(a.total_ksh || 0),
          paidAmount: Number(a.deposit_paid || 0),
          paymentStatus: (a.deposit_paid >= a.total_ksh ? 'full' : 'deposit') as any,
          paymentMethod: 'cash' as any,
          serviceStatus: (a.status === 'completed' ? 'served' : 'pending') as any,
          notes: '',
          isAllocation: true
        }));

        // Combine and remove duplicates (by ID)
        const combined = [...customersRes, ...mappedAllocations];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        return unique;
      } catch (err) {
        logger.error('Combined customers fetch error:', err);
        return [];
      }
    },
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useCreateCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => customerService.createCustomer(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      customerService.updateCustomer(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
};

export const useDeleteCustomerMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
};
