import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DecorAllocation {
  id: string;
  customer_name: string;
  month: number;
  year: number;
  row_number: number;
  walkway_stands: number;
  arc: number;
  aisle_stands: number;
  photobooth: number;
  lecturn: number;
  stage_boards: number;
  backdrop_boards: number;
  dance_floor: number;
  walkway_boards: number;
  white_sticker: number;
  centerpieces: number;
  glass_charger_plates: number;
  melamine_charger_plates: number;
  african_mats: number;
  gold_napkin_holders: number;
  silver_napkin_holders: number;
  roof_top_decor: number;
  parcan_lights: number;
  revolving_heads: number;
  fairy_lights: number;
  snake_lights: number;
  neon_lights: number;
  small_chandeliers: number;
  large_chandeliers: number;
  african_lampshades: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useDecorAllocationsQuery = (month: number, year: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['decor-allocations', month, year, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('decor_allocations')
        .select('*')
        .eq('month', month + 1)
        .eq('year', year)
        .order('row_number', { ascending: true });
      
      if (error) throw error;
      return data as DecorAllocation[];
    },
    enabled: !!user,
  });
};

export const useSaveDecorAllocationsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      allocations, 
      month, 
      year 
    }: { 
      allocations: Omit<DecorAllocation, 'id' | 'created_at' | 'updated_at' | 'user_id'>[], 
      month: number, 
      year: number 
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Delete existing allocations for this month/year
      await supabase
        .from('decor_allocations')
        .delete()
        .eq('month', month + 1)
        .eq('year', year);
      
      // Insert new allocations (only non-empty rows)
      const nonEmptyAllocations = allocations
        .filter(allocation => allocation.customer_name.trim() !== '')
        .map(allocation => ({
          ...allocation,
          month: month + 1,
          year,
          user_id: user.id
        }));
      
      if (nonEmptyAllocations.length > 0) {
        const { error } = await supabase
          .from('decor_allocations')
          .insert(nonEmptyAllocations);
        
        if (error) throw error;
      }
      
      return nonEmptyAllocations;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['decor-allocations', variables.month, variables.year] 
      });
      toast.success(`Saved ${data.length} decor allocations to database`);
    },
    onError: (error) => {
      console.error('Error saving decor allocations:', error);
      toast.error(`Failed to save decor allocations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};