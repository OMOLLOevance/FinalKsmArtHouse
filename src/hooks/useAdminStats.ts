import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminStats {
  totalUsers: number;
  pendingReset: number;
  adminCount: number;
}

export const useAdminStats = () => {
  const { user, isAuthenticated } = useAuth();
  
  const isAdmin = ['admin', 'director', 'investor', 'operations_manager'].includes(user?.role || '');

  return useQuery({
    queryKey: ['admin-stats'],
    enabled: isAuthenticated && isAdmin,
    queryFn: async () => {
      const result = await apiClient.get<any>('/api/admin/users');
      if (!result.success) throw new Error(result.error || 'Failed to fetch admin stats');
      return result.adminStats as AdminStats;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
