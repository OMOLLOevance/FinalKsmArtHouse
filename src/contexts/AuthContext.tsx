'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
// import { getAuthenticatedUser } from '@/utils/authHelpers'; // Removed
// Removed: import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userId: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;

  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Removed: const router = useRouter();
  // Removed: const pathname = usePathname();

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          role: session.user.user_metadata?.role || 'staff',
          createdAt: session.user.created_at || new Date().toISOString()
        };

        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Auth check failed';
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set loading to true initially
    setIsLoading(true);
    checkAuthStatus(); // Initial check

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // When signed in, update user data
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          role: session.user.user_metadata?.role || 'staff',
          createdAt: session.user.created_at || new Date().toISOString()
        };
        setUser(userData);
        setIsLoading(false);      } else if (event === 'SIGNED_OUT' || !session) {
        // When signed out or no session, clear user
        setUser(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // On token refresh, maintain user data
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          role: session.user.user_metadata?.role || 'staff',
          createdAt: session.user.created_at || new Date().toISOString()
        };
        setUser(userData);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  // Removed: Redirect logic useEffect
  // useEffect(() => {
  //   if (!isLoading) {
  //     if (!user && pathname !== '/login') {
  //       router.push('/login');
  //     } else if (user && pathname === '/login') {
  //       router.push('/');
  //     }
  //   }
  // }, [isLoading, user, pathname, router]);


  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message };
      }
      
      if (data.session?.user) {
        const userData: User = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName: data.session.user.user_metadata?.first_name || '',
          lastName: data.session.user.user_metadata?.last_name || '',
          role: data.session.user.user_metadata?.role || 'staff',
          createdAt: data.session.user.created_at || new Date().toISOString()
        };

        setUser(userData);
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error?.message || 'Login failed' };
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'staff' // Securely force 'staff' role at signup
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { success: false, message: error.message };
      }

      if (data.user) {
        return { success: true, message: 'Account created successfully! Please check your email to confirm.' };
      }

      return { success: false, message: 'Signup failed' };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error?.message || 'Signup failed' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      // Removed: router.push('/login'); // Redirect to login after logout
    } catch (error: any) {
      const errorMessage = error?.message || 'Logout failed';
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = !!user;
  const userId = user?.id || null;

  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    userId,
    login,
    signup,
    logout,
    isLoading
  }), [user, isAuthenticated, userId, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
