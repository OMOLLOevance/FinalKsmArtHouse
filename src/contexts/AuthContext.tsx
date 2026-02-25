'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userId: string | null;
  login: (_email: string, _password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (_userData: Omit<User, 'id' | 'createdAt'>, _password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  resetPassword: (_email: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  forcePasswordChange: boolean;
  setForcePasswordChange: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const getSession = useCallback(async () => {
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    
    sessionPromiseRef.current = supabase.auth.getSession();
    try {
      return await sessionPromiseRef.current;
    } finally {
      sessionPromiseRef.current = null;
    }
  }, []);

  const fetchProfile = async (userId: string): Promise<{ must_change_password: boolean; role: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('must_change_password, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Log more detail but don't treat as a crash-worthy error
        console.warn('Profile fetch notice:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session } } = await getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          role: profile?.role as any || session.user.user_metadata?.role || 'staff',
          createdAt: session.user.created_at || new Date().toISOString(),
          mustChangePassword: profile?.must_change_password || false
        };

        setUser(userData);
        if (profile?.must_change_password) {
          setForcePasswordChange(true);
        }
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = await fetchProfile(session.user.id);
        
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          role: profile?.role as any || session.user.user_metadata?.role || 'staff',
          createdAt: session.user.created_at || new Date().toISOString(),
          mustChangePassword: profile?.must_change_password || false
        };
        setUser(userData);
        if (profile?.must_change_password) {
          setForcePasswordChange(true);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setForcePasswordChange(false);
        setIsLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [checkAuthStatus]);


  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
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
        const profile = await fetchProfile(data.session.user.id);
        
        const userData: User = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName: data.session.user.user_metadata?.first_name || '',
          lastName: data.session.user.user_metadata?.last_name || '',
          role: profile?.role as any || data.session.user.user_metadata?.role || 'staff',
          createdAt: data.session.user.created_at || new Date().toISOString(),
          mustChangePassword: profile?.must_change_password || false
        };

        setUser(userData);
        if (profile?.must_change_password) {
          setForcePasswordChange(true);
        }
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error?.message || 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'staff',
            must_change_password: userData.mustChangePassword || false
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
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Use a race to prevent being stuck on lock acquisition
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timed out')), 3000)
      );
      
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error: any) {
      console.warn('Logout notice (proceeding with local cleanup):', error.message || error);
    } finally {
      // Always clear local state
      setUser(null);
      setForcePasswordChange(false);
      
      if (typeof window !== 'undefined') {
        // Aggressively clear Supabase-related storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.startsWith('supabase.auth.'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Use window.location for a clean state reload
        window.location.href = '/login';
      }
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      
      if (error) {
        console.error('Reset password error:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Password reset link has been sent to your email.' };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, message: error?.message || 'Failed to send reset link.' };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  const isAuthenticated = !!user;
  const userId = user?.id || null;

  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    userId,
    login,
    signup,
    logout,
    resetPassword,
    isLoading,
    forcePasswordChange,
    setForcePasswordChange,
    refreshUser
  }), [user, isAuthenticated, userId, isLoading, forcePasswordChange, login, signup, logout, resetPassword, refreshUser]);

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
