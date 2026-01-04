import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export const useCustomersQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  const { isDirectorOrInvestor, isOperationsManager } = useRoleGuard();
  
  return useQuery({
    queryKey: ['customers-combined', userId],
    queryFn: async () => {
      try {
        const isManagement = isDirectorOrInvestor() || isOperationsManager();
        
        // 1. Fetch from regular customers table
        let customersQuery = supabase.from('customers').select('*');
        if (!isManagement) {
          customersQuery = customersQuery.eq('user_id', userId);
        }
        const { data: customers = [] } = await customersQuery;
        
        // 2. Fetch from monthly allocations table
        let allocationsQuery = supabase
          .from('monthly_allocations')
          .select('id, customer_name, event_type, event_date, location, phone_number, total_ksh, deposit_paid, status');
        if (!isManagement) {
          allocationsQuery = allocationsQuery.eq('user_id', userId);
        }
        const { data: allocations = [] } = await allocationsQuery;

        // 3. Fetch from gym members table
        let gymQuery = supabase
          .from('gym_members')
          .select('id, name, phoneNumber, packageType, startDate, status');
        if (!isManagement) {
          gymQuery = gymQuery.eq('user_id', userId);
        }
        const { data: gymMembers = [] } = await gymQuery;

        // 4. Fetch from sauna bookings
        let saunaQuery = supabase
          .from('sauna_bookings')
          .select('id, client, date, status, amount');
        if (!isManagement) {
          saunaQuery = saunaQuery.eq('user_id', userId);
        }
        const { data: saunaBookings = [] } = await saunaQuery;

        // Map everything to a unified customer structure
        const mappedCustomers = (customers || []).map(c => ({
          ...c,
          eventType: c.event_type || 'General',
          eventDate: c.event_date || '-',
          source: 'core'
        }));

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
          serviceStatus: (a.status === 'completed' ? 'served' : 'pending') as any,
          source: 'allocation'
        }));

        const mappedGym = (gymMembers || []).map(g => ({
          id: g.id,
          name: g.name,
          contact: g.phoneNumber || 'N/A',
          location: 'Gym',
          eventType: `Gym Member (${g.packageType})`,
          eventDate: g.startDate,
          totalAmount: 0,
          paidAmount: 0,
          source: 'gym'
        }));

        const mappedSauna = (saunaBookings || []).map(s => ({
          id: s.id,
          name: s.client,
          contact: 'N/A',
          location: 'Sauna/Spa',
          eventType: 'Sauna Session',
          eventDate: s.date,
          totalAmount: Number(s.amount || 0),
          paidAmount: Number(s.amount || 0),
          source: 'sauna'
        }));

        // Combine all lists
        const combined = [
          ...mappedCustomers, 
          ...mappedAllocations, 
          ...mappedGym, 
          ...mappedSauna
        ];

        // De-duplicate by ID just in case
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        // Sort by name for easier searching
        return unique.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        logger.error('Global customers search error:', err);
        return [];
      }
    },
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
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
