import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from './useRoleGuard';
import { logger } from '@/lib/logger';

export interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { isManager } = useRoleGuard();

  const canViewStaff = isManager();

  useEffect(() => {
    async function fetchStaff() {
      if (!canViewStaff) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role')
          .order('first_name', { ascending: true });

        if (error) throw error;

        setStaff(data || []);
      } catch (error) {
        logger.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStaff();
  }, [canViewStaff]);

  return { staff, loading, canViewStaff };
}
