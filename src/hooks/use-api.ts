import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
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