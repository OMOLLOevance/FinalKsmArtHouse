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
    setIsLoading(true);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.replace(/[\r\n]/g, ' ') : 'Auth check failed';
      console.error('Auth check error:', { message: errorMessage });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus(); // Initial check

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // When auth state changes (e.g., SIGNED_IN), re-fetch user
        checkAuthStatus();
      } else {
        // If signed out or session is null, set user to null
        setUser(null);
        setIsLoading(false);
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
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
      
      if (data.user && !data.session) {
          return { success: false, message: 'Please check your email to confirm your account before logging in.' };
      }

      return { success: false, message: 'Session not created' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.replace(/[\r\n]/g, ' ') : 'Login failed';
      console.error('Login error:', { message: errorMessage });
      setUser(null);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      console.log('Signup payload:', { ...userData });
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {

          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'staff' // Default role
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { success: false, message: error.message };
      }

      // Automatically log in the user after signup
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
      }

      return { success: true, message: 'Account created successfully!' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message.replace(/[\r\n]/g, ' ') : 'Signup failed';
      console.error('Signup error:', { message: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      // Removed: router.push('/login'); // Redirect to login after logout
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.replace(/[\r\n]/g, ' ') : 'Logout failed';
      console.error('Logout error:', { message: errorMessage });
    } finally {
      setIsLoading(false);
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