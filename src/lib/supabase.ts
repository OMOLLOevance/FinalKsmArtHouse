import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database connection test
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Database connected successfully' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
};

// Initialize user profile after signup
export const initializeUserProfile = async (userId: string, userData: {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || 'staff'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initialize profile' 
    };
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  const tables = [
    'users', 'customers', 'gym_members', 'gym_finances',
    'sauna_bookings', 'spa_bookings', 'sauna_spa_finances',
    'restaurant_sales', 'event_items', 'catering_inventory', 'quotations'
  ];

  const results = await Promise.allSettled(
    tables.map(async (table) => {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        return { table, status: error ? 'error' : 'ok', error: error?.message };
      } catch (err) {
        return { 
          table, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
      }
    })
  );

  return results.map((result, index) => ({
    tableName: tables[index],
    ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Promise rejected' })
  }));
};