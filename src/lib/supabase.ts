import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('CRITICAL: Supabase environment variables are missing. Authentication and database features will not work.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://mqnfdmdqfysqxxamgvwc.supabase.co', 
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmZkbWRxZnlzcXh4YW1ndndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODY1MDcsImV4cCI6MjA4MjY2MjUwN30.sMqYbNbF8371DgcSjXMzwfI5vqX3tdwCzqfBIfaaH3w', 
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disabled for better performance as per optimized config
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'ksm-art-house@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database health check
export const checkDatabaseHealth = async () => {
  const tables = [
    'users', 'customers', 'gym_members', 'gym_finances',
    'restaurant_sales', 'sauna_bookings'
  ];


  const results = await Promise.allSettled(
    tables.map(async (table) => {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
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


// Database connection test (legacy support)
export const testConnection = async () => {
  const healthResults = await checkDatabaseHealth();
  const isHealthy = healthResults.every(r => r.status === 'ok');
  return {
    success: isHealthy,
    message: isHealthy ? 'Database connected successfully' : 'Some database tables are inaccessible'
  };
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