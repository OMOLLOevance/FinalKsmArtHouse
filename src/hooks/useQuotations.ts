import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
// Define types locally since they're not in the main types file
interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  remarks: string;
}

interface QuotationSection {
  name: string;
  items: QuotationItem[];
}

interface AdditionalCharges {
  cateringLabour: number;
  serviceCharge: number;
  transport: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfGuests: number;
  theme: string;
  eventDate: string;
  eventType: string;
  customEventType: string;
  quotationType: 'event' | 'food';
  sections: QuotationSection[];
  grandTotal: number;
  additionalCharges: AdditionalCharges;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  notes: string;
}
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export const useQuotations = () => {
  const { user, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    if (authLoading) return; // Don't fetch if auth is still loading

    try {
      setLoading(true);
      if (!isAuthenticated || !userId) {
        setQuotations([]); // Clear quotations if not authenticated
        setError('User not authenticated');
        return;
      }

      const userIsAdmin = user?.role === 'admin';

      let query = supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userIsAdmin) {
        query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setQuotations(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchQuotations();
    }
  }, [fetchQuotations, authLoading]);

  // Realtime subscription setup
  useEffect(() => {
    if (!authLoading && userId) {
      const channel = supabase
        .channel('quotations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quotations',
            filter: `user_id=eq.${userId}` // Filter for specific user's changes if not admin
          },
          (payload) => {
            // Re-fetch everything to ensure consistency after real-time update
            fetchQuotations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchQuotations, authLoading, userId]);

  const createQuotation = useCallback(async (quotationData: any) => {
    try {
      setError(null);
      if (!userId) throw new Error('User not authenticated');

      const dataToInsert = {
        user_id: userId, // Use userId from context
        customer_name: quotationData.customer_name || '',
        customer_email: quotationData.customer_email || '',
        customer_phone: quotationData.customer_phone || '',
        number_of_guests: quotationData.number_of_guests || 0,
        theme: quotationData.theme || '',
        event_date: quotationData.event_date || null,
        event_type: quotationData.event_type || '',
        custom_event_type: quotationData.custom_event_type || '',
        quotation_type: quotationData.quotation_type || 'Event/Decor',
        sections: quotationData.sections || [],
        additional_charges: quotationData.additional_charges || { cateringLabour: 0, serviceCharge: 0, transport: 0 },
        notes: quotationData.notes || '',
        status: quotationData.status || 'draft',
        total_amount: quotationData.total_amount || 0
      };

      const { data, error: insertError } = await supabase
        .from('quotations')
        .insert([dataToInsert])
        .select()
        .single();

      if (insertError) throw new Error(`Database error: ${insertError.message}`);

      // setQuotations(prev => [data, ...prev]); // Realtime subscription will handle this
      return data;
    } catch (err: any) {
      console.error('❌ Error creating quotation:', err);
      setError(err.message || 'Failed to create quotation');
      throw err;
    }
  }, [userId]);

  const updateQuotation = useCallback(async (id: string, updates: Partial<Quotation>) => {
    try {
      setError(null);
      if (!userId) throw new Error('User not authenticated');

      const { data, error: updateError } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure only own data can be updated
        .select()
        .single();

      if (updateError) throw new Error(`Database error: ${updateError.message}`);

      // setQuotations(prev => prev.map(q => q.id === id ? data : q)); // Realtime subscription will handle this
      return { success: true, data };
    } catch (err: any) {
      console.error('❌ Error updating quotation:', err);
      setError(err.message || 'Failed to update quotation');
      return { success: false, error: err.message };
    }
  }, [userId]);

  const deleteQuotation = useCallback(async (id: string) => {
    try {
      setError(null);
      if (!userId) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure only own data can be deleted

      if (deleteError) throw deleteError;

      // setQuotations(prev => prev.filter(q => q.id !== id)); // Realtime subscription will handle this
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error deleting quotation:', err);
      setError(err.message || 'Failed to delete quotation');
      return { success: false, error: err.message };
    }
  }, [userId]);

  const getQuotationById = useCallback(async (id: string) => {
    try {
      setError(null);
      if (!userId) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only get their own quotation
        .single();

      if (fetchError) throw fetchError;

      return { success: true, data };
    } catch (err: any) {
      console.error('Error fetching quotation:', err);
      setError(err.message || 'Failed to fetch quotation');
      return { success: false, error: err.message };
    }
  }, [userId]);

  const updateQuotationStatus = useCallback(async (id: string, status: Quotation['status']) => {
    return updateQuotation(id, { status });
  }, [updateQuotation]);

  const combinedLoading = loading || authLoading;

  return {
    quotations,
    loading: combinedLoading,
    error,
    fetchQuotations,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById,
    updateQuotationStatus,
  };
};