import { supabase } from '@/lib/supabase';
import { User } from '@/types';

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

    const { data: profile, error: profileError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (profileError || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      password: '', // Don't return password
      createdAt: profile.created_at
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}