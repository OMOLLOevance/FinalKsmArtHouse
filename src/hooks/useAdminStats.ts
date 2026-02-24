import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.adminStats as AdminStats;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
