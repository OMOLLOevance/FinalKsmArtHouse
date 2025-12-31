// DEPRECATED: Use useGymMembersQuery and useGymFinancesQuery from use-gym-api.ts instead
// This file is kept for backward compatibility during migration

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GymMember, GymFinance } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// MIGRATION NOTICE: Replace with useGymMembersQuery from @/hooks/use-gym-api
export const useGymMembers = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setMembers([]);
        setError('User not authenticated');
        return;
      }

      const userIsAdmin = user?.role === 'admin';

      const query = supabase
        .from('gym_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) {
        toast.error(`Failed to fetch gym members: ${fetchError.message}`);
        throw fetchError;
      }

      const mappedMembers = (data || []).map(dbMember => ({
        id: dbMember.id,
        name: dbMember.member_name,
        phoneNumber: dbMember.phone,
        email: dbMember.email,
        packageType: dbMember.membership_type as 'weekly' | 'monthly' | 'three-months',
        amountPaid: Number(dbMember.payment_amount),
        startDate: dbMember.start_date,
        endDate: dbMember.expiry_date,
        status: dbMember.status as 'active' | 'expired',
        createdAt: dbMember.created_at
      }));

      setMembers(mappedMembers);
      setError(null);
    } catch (err) {
      console.error('Error fetching gym members:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gym members';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchMembers();
    }
  }, [fetchMembers, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('gym_members_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gym_members'
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchMembers, authLoading, userId]);

  const addMember = useCallback(async (member: Omit<GymMember, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const dbMember = {
        user_id: userId,
        member_name: member.name,
        email: member.email || null,
        phone: member.phoneNumber || null,
        membership_type: member.packageType,
        start_date: member.startDate,
        expiry_date: member.endDate,
        status: member.status || 'active',
        payment_amount: member.amountPaid || 0,
        payment_status: 'paid',
        notes: null
      };

      const { data, error } = await supabase
        .from('gym_members')
        .insert([dbMember])
        .select()
        .single();

      if (error) {
        toast.error(`Failed to add member: ${error.message}`);
        throw error;
      }

      const frontendMember = {
        id: data.id,
        name: data.member_name,
        phoneNumber: data.phone,
        email: data.email,
        packageType: data.membership_type as 'weekly' | 'monthly' | 'three-months',
        amountPaid: Number(data.payment_amount),
        startDate: data.start_date,
        endDate: data.expiry_date,
        status: data.status as 'active' | 'expired',
        createdAt: data.created_at
      };

      setMembers(prev => [frontendMember, ...prev]);
      toast.success('Member added successfully');
      return frontendMember;
    } catch (err) {
      console.error('Error adding gym member:', err);
      throw err;
    }
  }, [userId]);

  const updateMember = useCallback(async (id: string, updates: Partial<GymMember>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.member_name = updates.name;
      if (updates.phoneNumber !== undefined) dbUpdates.phone = updates.phoneNumber;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.packageType !== undefined) dbUpdates.membership_type = updates.packageType;
      if (updates.amountPaid !== undefined) dbUpdates.payment_amount = updates.amountPaid;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.expiry_date = updates.endDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('gym_members')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        toast.error(`Failed to update member: ${error.message}`);
        throw error;
      }

      const frontendMember = {
        id: data.id,
        name: data.member_name,
        phoneNumber: data.phone,
        email: data.email,
        packageType: data.membership_type as 'weekly' | 'monthly' | 'three-months',
        amountPaid: Number(data.payment_amount),
        startDate: data.start_date,
        endDate: data.expiry_date,
        status: data.status as 'active' | 'expired',
        createdAt: data.created_at
      };

      setMembers(prev => prev.map(m => m.id === id ? frontendMember : m));
      toast.success('Member updated successfully');
      return frontendMember;
    } catch (err) {
      console.error('Error updating gym member:', err);
      throw err;
    }
  }, [userId]);

  const deleteMember = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('gym_members')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        toast.error(`Failed to delete member: ${error.message}`);
        throw error;
      }

      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Member deleted successfully');
    } catch (err) {
      console.error('Error deleting gym member:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { members, loading: combinedLoading, error, syncing, addMember, updateMember, deleteMember, refetch: fetchMembers };
};

// MIGRATION NOTICE: Replace with useGymFinancesQuery from @/hooks/use-gym-api
export const useGymFinances = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [finances, setFinances] = useState<GymFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchFinances = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setFinances([]);
        setError('User not authenticated');
        return;
      }

      const userIsAdmin = user?.role === 'admin';

      const query = supabase
        .from('gym_finances')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) {
        toast.error(`Failed to fetch gym finances: ${fetchError.message}`);
        throw fetchError;
      }

      const mappedFinances = (data || []).map(dbFinance => ({
        id: dbFinance.id,
        date: dbFinance.transaction_date,
        description: dbFinance.description,
        amount: Number(dbFinance.amount),
        type: (dbFinance.transaction_type === 'membership' || dbFinance.transaction_type === 'income') ? 'income' as const : 'expense' as const,
        createdAt: dbFinance.created_at
      }));

      setFinances(mappedFinances);
      setError(null);
    } catch (err) {
      console.error('Error fetching gym finances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gym finances';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchFinances();
    }
  }, [fetchFinances, authLoading]);

  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('gym_finances_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gym_finances'
          },
          () => {
            fetchFinances();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchFinances, authLoading, userId]);

  const addFinance = useCallback(async (finance: Omit<GymFinance, 'id'>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const dbFinance = {
        user_id: userId,
        transaction_date: finance.date,
        description: finance.description || '',
        amount: finance.amount,
        transaction_type: finance.type,
        payment_method: 'cash'
      };

      const { data, error } = await supabase
        .from('gym_finances')
        .insert([dbFinance])
        .select()
        .single();

      if (error) {
        toast.error(`Failed to add finance record: ${error.message}`);
        throw error;
      }

      const frontendFinance = {
        id: data.id,
        date: data.transaction_date,
        description: data.description,
        amount: Number(data.amount),
        type: (data.transaction_type === 'membership' || data.transaction_type === 'income') ? 'income' : 'expense' as 'income' | 'expense',
        createdAt: data.created_at
      };

      setFinances(prev => [frontendFinance, ...prev]);
      toast.success('Finance record added successfully');
      return frontendFinance;
    } catch (err) {
      console.error('Error adding gym finance:', err);
      throw err;
    }
  }, [userId]);

  const updateFinance = useCallback(async (id: string, updates: Partial<GymFinance>) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const dbUpdates: any = {};
      if (updates.date !== undefined) dbUpdates.transaction_date = updates.date;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.type !== undefined) dbUpdates.transaction_type = updates.type;

      const { data, error } = await supabase
        .from('gym_finances')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        toast.error(`Failed to update finance record: ${error.message}`);
        throw error;
      }

      const frontendFinance = {
        id: data.id,
        date: data.transaction_date,
        description: data.description,
        amount: Number(data.amount),
        type: (data.transaction_type === 'membership' || data.transaction_type === 'income') ? 'income' : 'expense' as 'income' | 'expense',
        createdAt: data.created_at
      };

      setFinances(prev => prev.map(f => f.id === id ? frontendFinance : f));
      toast.success('Finance record updated successfully');
      return frontendFinance;
    } catch (err) {
      console.error('Error updating gym finance:', err);
      throw err;
    }
  }, [userId]);

  const deleteFinance = useCallback(async (id: string) => {
    try {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('gym_finances')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        toast.error(`Failed to delete finance record: ${error.message}`);
        throw error;
      }

      setFinances(prev => prev.filter(f => f.id !== id));
      toast.success('Finance record deleted successfully');
    } catch (err) {
      console.error('Error deleting gym finance:', err);
      throw err;
    }
  }, [userId]);

  const combinedLoading = loading || authLoading;

  return { finances, loading: combinedLoading, error, syncing, addFinance, updateFinance, deleteFinance, refetch: fetchFinances };
};