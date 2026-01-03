'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const useRealtimeInvalidation = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gym_members' },
        (payload) => {
          logger.info('Realtime update: gym_members', payload);
          queryClient.invalidateQueries({ queryKey: ['gym', 'members'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gym_finances' },
        (payload) => {
          logger.info('Realtime update: gym_finances', payload);
          queryClient.invalidateQueries({ queryKey: ['gym', 'finances'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sauna_bookings' },
        (payload) => {
          logger.info('Realtime update: sauna_bookings', payload);
          queryClient.invalidateQueries({ queryKey: ['sauna', 'bookings'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_sales' },
        (payload) => {
          logger.info('Realtime update: restaurant_sales', payload);
          queryClient.invalidateQueries({ queryKey: ['restaurant', 'sales'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
