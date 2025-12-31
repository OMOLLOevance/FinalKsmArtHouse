import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymSupabaseService } from '@/services/gym-supabase.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Gym Members Hooks
export const useGymMembersQuery = () => {
  const { userId, user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['gym', 'members', userId],
    queryFn: () => gymSupabaseService.getMembers(userId!, user?.role === 'admin'),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCreateGymMemberMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => gymSupabaseService.createMember(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add member: ${error.message}`);
    },
  });
};

export const useUpdateGymMemberMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      gymSupabaseService.updateMember(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member: ${error.message}`);
    },
  });
};

export const useDeleteGymMemberMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => gymSupabaseService.deleteMember(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete member: ${error.message}`);
    },
  });
};

// Gym Finances Hooks
export const useGymFinancesQuery = () => {
  const { userId, user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['gym', 'finances', userId],
    queryFn: () => gymSupabaseService.getFinances(userId!, user?.role === 'admin'),
    enabled: !!userId && isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCreateGymFinanceMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => gymSupabaseService.createFinance(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add finance record: ${error.message}`);
    },
  });
};

export const useUpdateGymFinanceMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      gymSupabaseService.updateFinance(userId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update finance record: ${error.message}`);
    },
  });
};

export const useDeleteGymFinanceMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => gymSupabaseService.deleteFinance(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete finance record: ${error.message}`);
    },
  });
};