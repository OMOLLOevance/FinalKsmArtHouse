import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { gymService } from '@/services/gym.service';
import { toast } from 'sonner';
import { tokenStorage } from '@/lib/token-storage';

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      tokenStorage.setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Login successful');
    },
    onError: (error) => {
      toast.error('Login failed');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      tokenStorage.setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Registration successful');
    },
    onError: (error) => {
      toast.error('Registration failed');
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Gym hooks
export const useGymMembers = () => {
  return useQuery({
    queryKey: ['gym', 'members'],
    queryFn: gymService.getMembers,
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateGymMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gymService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member added successfully');
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });
};

export const useUpdateGymMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      gymService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member updated successfully');
    },
    onError: () => {
      toast.error('Failed to update member');
    },
  });
};

export const useDeleteGymMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gymService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
      toast.success('Member deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete member');
    },
  });
};

export const useGymFinances = () => {
  return useQuery({
    queryKey: ['gym', 'finances'],
    queryFn: gymService.getFinances,
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateGymFinance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gymService.createFinance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record added successfully');
    },
    onError: () => {
      toast.error('Failed to add finance record');
    },
  });
};

export const useUpdateGymFinance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      gymService.updateFinance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record updated successfully');
    },
    onError: () => {
      toast.error('Failed to update finance record');
    },
  });
};

export const useDeleteGymFinance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gymService.deleteFinance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
      toast.success('Finance record deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete finance record');
    },
  });
};