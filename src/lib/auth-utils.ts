import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedClient } from './supabase';

// Shared admin client initialization
export const createAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Fallback to anon client for development
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Shared user role helper
export const getUserRole = async (userId: string, client: any): Promise<string> => {
  try {
    const { data } = await client
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role || 'staff';
  } catch (error) {
    return 'staff'; // Default fallback
  }
};

// Check if user is manager
export const isManager = (role: string): boolean => {
  return ['director', 'investor', 'operations_manager'].includes(role);
};

// Get authenticated client with role escalation
export const getClientWithRole = async (token?: string) => {
  const adminClient = createAdminClient();
  let client = adminClient; // Use admin client by default
  let userRole = 'staff';
  let userId = null;

  if (token) {
    try {
      const authClient = createAuthenticatedClient(token);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        userId = user.id;
        userRole = await getUserRole(user.id, authClient);
        if (isManager(userRole)) {
          client = adminClient;
        } else {
          client = authClient;
        }
      }
    } catch (error) {
      // Fallback to admin client for API operations
      client = adminClient;
    }
  }

  return { client, userRole, userId, isManager: isManager(userRole) };
};