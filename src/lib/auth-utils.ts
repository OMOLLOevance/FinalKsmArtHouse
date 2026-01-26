import type { SupabaseClient } from '@supabase/supabase-js';

// Shared user role helper
export const getUserRole = async (userId: string, client: SupabaseClient): Promise<string> => {
  try {
    const { data, error } = await client
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user role:', error.message);
      return 'staff'; // Default to least privileged role on error
    }
    
    return data?.role || 'staff';
  } catch (error) {
    console.error('Exception fetching user role:', error);
    return 'staff'; // Default fallback
  }
};

// Check if user is manager
export const isManager = (role: string): boolean => {
  return ['director', 'investor', 'operations_manager'].includes(role);
};