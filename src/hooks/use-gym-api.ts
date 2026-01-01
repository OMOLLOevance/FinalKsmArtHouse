import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymService } from '@/services/gym.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';


// Gym Members Hooks
export const useGymMembersQuery = () => {
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['gym', 'members', userId],
    queryFn: () => gymService.getMembers(userId!).catch(err => {
      logger.error('Gym members fetch error:', err);
      return [];
    }),
    enabled: !!userId && isAuthenticated,

    retry: 3,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateGymMemberMutation = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => gymService.createMember(userId!, data),
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
      gymService.updateMember(userId!, id, data),
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
    mutationFn: (id: string) => gymService.deleteMember(userId!, id),
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
  const { userId, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['gym', 'finances', userId],
    queryFn: () => gymService.getFinances(userId!).catch(err => {
      logger.error('Gym finances fetch error:', err);
      return [];
    }),
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
    mutationFn: (data: any) => gymService.createFinance(userId!, data),
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
      gymService.updateFinance(userId!, id, data),
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
    mutationFn: (id: string) => gymService.deleteFinance(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete finance record: ${error.message}`);
    },
  });
};
