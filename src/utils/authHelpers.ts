import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { safeLog } from '@/lib/sanitizer';

export async function ensureAuthenticated(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function isAdmin(user?: User): Promise<boolean> {
  if (!user) {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) return false;
    return currentUser.role === 'admin';
  }
  return user.role === 'admin';
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Use Supabase auth user data directly
    return {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      role: user.user_metadata?.role || 'staff',
      password: '', // Don't return password
      createdAt: user.created_at || new Date().toISOString()
    };
  } catch (error) {
    safeLog.error('Error getting authenticated user:', error);
    return null;
  }
}