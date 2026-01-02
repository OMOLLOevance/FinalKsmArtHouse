import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CustomerAllocation {
  customer_id: string;
  customer_name: string;
  event_date: string;
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
}

export interface InventoryLimits {
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
}

export const useMonthlyAllocationsQuery = (month: number, year: number) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-allocations', month, year],
    queryFn: async (): Promise<CustomerAllocation[]> => {
      // Get start and end dates for the month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      // Fetch customers with events in the selected month and their decor items
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          event_date,
          decor_items (
            walkway_stands,
            arc,
            aisle_stands,
            photobooth,
            lecturn,
            stage_boards,
            backdrop_boards,
            dance_floor,
            walkway_boards,
            white_sticker,
            centerpieces,
            glass_charger_plates,
            melamine_charger_plates,
            african_mats,
            gold_napkin_holders,
            silver_napkin_holders,
            roof_top_decor,
            parcan_lights,
            revolving_heads,
            fairy_lights,
            snake_lights,
            neon_lights,
            small_chandeliers,
            large_chandeliers,
            african_lampshades
          )
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

      if (error) {
        logger.error('Monthly allocations fetch error:', error);
        throw error;
      }

      // Transform the data to flatten decor_items
      const allocations: CustomerAllocation[] = (data || []).map(customer => {
        const decorItems = customer.decor_items?.[0] || {};
        return {
          customer_id: customer.id,
          customer_name: customer.name,
          event_date: customer.event_date,
          walkway_stands: decorItems.walkway_stands || 0,
          arc: decorItems.arc || 0,
          aisle_stands: decorItems.aisle_stands || 0,
          photobooth: decorItems.photobooth || 0,
          lecturn: decorItems.lecturn || 0,
          stage_boards: decorItems.stage_boards || 0,
          backdrop_boards: decorItems.backdrop_boards || 0,
          dance_floor: decorItems.dance_floor || 0,
          walkway_boards: decorItems.walkway_boards || 0,
          white_sticker: decorItems.white_sticker || 0,
          centerpieces: decorItems.centerpieces || 0,
          glass_charger_plates: decorItems.glass_charger_plates || 0,
          melamine_charger_plates: decorItems.melamine_charger_plates || 0,
          african_mats: decorItems.african_mats || 0,
          gold_napkin_holders: decorItems.gold_napkin_holders || 0,
          silver_napkin_holders: decorItems.silver_napkin_holders || 0,
          roof_top_decor: decorItems.roof_top_decor || 0,
          parcan_lights: decorItems.parcan_lights || 0,
          revolving_heads: decorItems.revolving_heads || 0,
          fairy_lights: decorItems.fairy_lights || 0,
          snake_lights: decorItems.snake_lights || 0,
          neon_lights: decorItems.neon_lights || 0,
          small_chandeliers: decorItems.small_chandeliers || 0,
          large_chandeliers: decorItems.large_chandeliers || 0,
          african_lampshades: decorItems.african_lampshades || 0,
        };
      });

      return allocations;
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 2 * 60 * 1000,
  });
};

export const useInventoryLimitsQuery = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-limits'],
    queryFn: async (): Promise<InventoryLimits> => {
      // Try to get limits from decor_inventory table
      const { data, error } = await supabase
        .from('decor_inventory')
        .select('category, in_store')
        .order('category');

      if (error) {
        logger.error('Inventory limits fetch error:', error);
        // Return hardcoded limits as fallback
        return {
          walkway_stands: 50,
          arc: 20,
          aisle_stands: 30,
          photobooth: 5,
          lecturn: 10,
          stage_boards: 25,
          backdrop_boards: 15,
          dance_floor: 8,
          walkway_boards: 40,
          white_sticker: 100,
          centerpieces: 60,
          glass_charger_plates: 200,
          melamine_charger_plates: 150,
          african_mats: 80,
          gold_napkin_holders: 100,
          silver_napkin_holders: 100,
          roof_top_decor: 20,
          parcan_lights: 30,
          revolving_heads: 15,
          fairy_lights: 50,
          snake_lights: 25,
          neon_lights: 20,
          small_chandeliers: 40,
          large_chandeliers: 20,
          african_lampshades: 35,
        };
      }

      // Map inventory data to our structure (simplified for now)
      return {
        walkway_stands: 50,
        arc: 20,
        aisle_stands: 30,
        photobooth: 5,
        lecturn: 10,
        stage_boards: 25,
        backdrop_boards: 15,
        dance_floor: 8,
        walkway_boards: 40,
        white_sticker: 100,
        centerpieces: 60,
        glass_charger_plates: 200,
        melamine_charger_plates: 150,
        african_mats: 80,
        gold_napkin_holders: 100,
        silver_napkin_holders: 100,
        roof_top_decor: 20,
        parcan_lights: 30,
        revolving_heads: 15,
        fairy_lights: 50,
        snake_lights: 25,
        neon_lights: 20,
        small_chandeliers: 40,
        large_chandeliers: 20,
        african_lampshades: 35,
      };
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
};

export const useAddCustomerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      // Create a new customer for the selected month
      const eventDate = new Date(year, month, 15).toISOString().split('T')[0]; // Mid-month date
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: 'New Customer',
          event_date: eventDate,
          phone: '',
          email: '',
          event_type: 'Wedding',
          location: '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-allocations'] });
      toast.success('New customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
};
export const useUpdateAllocationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      field, 
      value 
    }: { 
      customerId: string; 
      field: string; 
      value: number; 
    }) => {
      // First, check if decor_items record exists for this customer
      const { data: existing, error: fetchError } = await supabase
        .from('decor_items')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('decor_items')
          .update({ [field]: value })
          .eq('customer_id', customerId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', customerId)
          .single();

        const { data, error } = await supabase
          .from('decor_items')
          .insert({
            customer_id: customerId,
            customer_name: customer?.name || 'Unknown',
            [field]: value
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-allocations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update allocation: ${error.message}`);
    },
  });
};

export const useMonthlyAllocations = (month: number, year: number) => {
  const allocationsQuery = useMonthlyAllocationsQuery(month, year);
  const limitsQuery = useInventoryLimitsQuery();
  const updateMutation = useUpdateAllocationMutation();
  const addCustomerMutation = useAddCustomerMutation();

  return {
    allocations: allocationsQuery.data || [],
    inventoryLimits: limitsQuery.data,
    loading: allocationsQuery.isLoading || limitsQuery.isLoading,
    error: allocationsQuery.error || limitsQuery.error,
    updateAllocation: updateMutation.mutateAsync,
    addCustomer: addCustomerMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};