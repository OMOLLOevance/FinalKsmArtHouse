'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeInvalidation = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Get auth state

  useEffect(() => {
    // Only subscribe if authenticated and auth state is loaded
    if (!isAuthenticated || authLoading) {
      return; // Do not subscribe if not authenticated or still loading auth
    }

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'decor_inventory' },
        (payload) => {
          logger.info('Realtime update: decor_inventory', payload);
          queryClient.invalidateQueries({ queryKey: ['decor-inventory'] });
          queryClient.invalidateQueries({ queryKey: ['decor-categories'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          logger.info('Realtime update: customers', payload);
          queryClient.invalidateQueries({ queryKey: ['customer-data-records'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        (payload) => {
          logger.info('Realtime update: quotations', payload);
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          logger.info('Realtime update: clients', payload);
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isAuthenticated, authLoading]); // Add isAuthenticated and authLoading to dependencies
};
