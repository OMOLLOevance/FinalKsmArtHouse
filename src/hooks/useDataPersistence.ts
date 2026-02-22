import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useDataPersistence = <T,>(key: string, defaultValue: T): [T, (value: T) => void] => {
  const { user } = useAuth();
  
  // Initialize state directly from localStorage if available
  const [data, setData] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Error parsing stored data:', error);
        }
      }
    }
    return defaultValue;
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
          try {
            setData(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Error parsing storage event data:', error);
          }
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [key]);

  const setValue = useCallback((value: T) => {
    setData(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key]);

  return [data, setValue];
};

// Keep the old hook for backward compatibility
export const useDataPersistenceOld = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const saveToDatabase = useCallback(async (table: string, data: any) => {
    if (!user?.id || !isOnline) return false;
    
    try {
      const { error } = await supabase
        .from(table)
        .upsert({ ...data, user_id: user.id });
      
      return !error;
    } catch (error) {
      console.error(`Error saving to ${table}:`, error);
      return false;
    }
  }, [user?.id, isOnline]);

  const loadFromDatabase = useCallback(async (table: string) => {
    if (!user?.id || !isOnline) return null;
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);
      
      return error ? null : data;
    } catch (error) {
      console.error(`Error loading from ${table}:`, error);
      return null;
    }
  }, [user?.id, isOnline]);

  return {
    saveToDatabase,
    loadFromDatabase,
    isOnline,
    trackDataChange: () => {}, // Placeholder for compatibility
    syncToCloud: async () => true, // Placeholder for compatibility
  };
};