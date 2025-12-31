import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Updated import path
import { supabase } from '../lib/supabase';

interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  syncing: boolean;
  error: string | null;
  pendingChanges: number;
  deviceId: string;
  lastUpdateFrom: string | null;
}

interface CloudData {
  timestamp: string;
  deviceId: string;
  userId: string;
  data: Record<string, any>;
  version: string;
  changeLog: Array<{
    timestamp: string;
    deviceId: string;
    action: string;
    collection: string;
    itemId?: string;
  }>;
}

interface SyncEvent {
  type: 'data_updated' | 'sync_complete' | 'device_connected';
  deviceId: string;
  timestamp: string;
  data?: any;
}

export const useCloudSync = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // Destructure user, isAuthenticated, isLoading
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false, // Check if navigator exists
    lastSync: typeof localStorage !== 'undefined' ? localStorage.getItem('ksm_last_cloud_sync') : null, // Check if localStorage exists
    syncing: false,
    error: null,
    pendingChanges: 0,
    deviceId: '',
    lastUpdateFrom: null
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const changeTrackingRef = useRef<Set<string>>(new Set());

  // Enable cloud sync with Supabase real-time
  const CLOUD_SYNC_ENABLED = true;

  const getDeviceId = useCallback((): string => {
    if (typeof localStorage === 'undefined') return 'server_device'; // Handle SSR
    let deviceId = localStorage.getItem('ksm_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ksm_device_id', deviceId);
    }
    return deviceId;
  }, []);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') { // Only run on client-side
      const deviceId = getDeviceId();
      setSyncStatus(prev => ({ ...prev, deviceId }));

      const deviceRegistry = JSON.parse(localStorage.getItem('ksm_device_registry') || '[]');
      const existingDevice = deviceRegistry.find((d: any) => d.id === deviceId);

      if (!existingDevice) {
        deviceRegistry.push({
          id: deviceId,
          name: `Device ${deviceRegistry.length + 1}`,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          registeredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
        localStorage.setItem('ksm_device_registry', JSON.stringify(deviceRegistry));
      }
    }
  }, [getDeviceId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        setSyncStatus(prev => ({ ...prev, isOnline: true, error: null }));
        if (CLOUD_SYNC_ENABLED) {
          setTimeout(() => {
            if (changeTrackingRef.current.size > 0) {
              syncToCloud();
            }
          }, 1000);
        }
      };

      const handleOffline = () => {
        setSyncStatus(prev => ({ ...prev, isOnline: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const trackDataChange = useCallback((collection: string, action: string, itemId?: string) => {
    if (!CLOUD_SYNC_ENABLED || typeof localStorage === 'undefined') {
      return;
    }

    changeTrackingRef.current.add(`${collection}_${action}_${itemId || 'bulk'}`);
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: changeTrackingRef.current.size
    }));

    if (syncIntervalRef.current) {
      clearTimeout(syncIntervalRef.current);
    }

    if (!authLoading && isAuthenticated) {
        syncIntervalRef.current = setTimeout(() => {
            if (syncStatus.isOnline) {
                syncToCloud();
            }
        }, 30000);
    }
  }, [syncStatus.isOnline, isAuthenticated, authLoading]);

  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!CLOUD_SYNC_ENABLED || typeof localStorage === 'undefined') {
      console.log('Cloud sync is disabled or running on server');
      return true;
    }

    if (!syncStatus.isOnline || !user?.id) {
      setSyncStatus(prev => ({ ...prev, error: 'No internet connection or user not authenticated' }));
      return false;
    }

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const allData: Record<string, any> = {};
      const dataKeys = [
        'customers',
        'catering-items',
        'decor-items',
        'decor-data-table',
        'sanitation-items',
        'entertainment-equipment',
        'djmc-bookings',
        'gym-finances',
        'gym-members',
        'sauna-bookings',
        'spa-bookings',
        'sauna-spa-finances',
        'restaurant-sales',
        'customer-requirements',
        'catering-inventory',
        'monthly-expenses',
        'decor-categories-structure',
        'catering-structure',
      ];

      dataKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            allData[key] = JSON.parse(data);
          } catch {
            allData[key] = data;
          }
        }
      });

      const changeLog = Array.from(changeTrackingRef.current).map(change => ({
        timestamp: new Date().toISOString(),
        deviceId: syncStatus.deviceId,
        action: change.split('_')[1] || 'update',
        collection: change.split('_')[0] || 'unknown',
        itemId: change.split('_')[2] || undefined
      }));

      const timestamp = new Date().toISOString();

      const cloudData = {
        user_id: user.id,
        data: allData,
        device_id: syncStatus.deviceId,
        version: '3.0',
        change_log: changeLog,
        updated_at: timestamp
      };

      const { data: existingData, error: fetchError } = await supabase
        .from('cloud_sync_data')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingData) {
        const { error: updateError } = await supabase
          .from('cloud_sync_data')
          .update(cloudData)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cloud_sync_data')
          .insert(cloudData);

        if (insertError) throw insertError;
      }

      localStorage.setItem('ksm_last_cloud_sync', timestamp);

      const syncEvent: SyncEvent = {
        type: 'sync_complete',
        deviceId: syncStatus.deviceId,
        timestamp: timestamp,
        data: { changeCount: changeLog.length }
      };

      localStorage.setItem('ksm_sync_event', JSON.stringify(syncEvent));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'ksm_sync_event',
        newValue: JSON.stringify(syncEvent)
      }));

      changeTrackingRef.current.clear();

      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: timestamp,
        error: null,
        pendingChanges: 0
      }));

      console.log('✅ Data synced to Supabase cloud successfully at:', new Date(timestamp).toLocaleString());
      return true;

    } catch (error: any) {
      console.error('Sync to cloud failed:', error);
      
      if (error.message?.includes('change_log') || error.message?.includes('PGRST204')) {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: 'Database schema mismatch. Please run the schema fix script.'
        }));
      } else {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: error.message || 'Failed to sync to cloud'
        }));
      }
      return false;
    }
  }, [syncStatus.isOnline, syncStatus.deviceId, user?.id, isAuthenticated, authLoading]);

  const updateFromCloud = useCallback(async (): Promise<boolean> => {
    if (!CLOUD_SYNC_ENABLED || typeof localStorage === 'undefined') { // Handle SSR
      console.log('Cloud sync is disabled or running on server');
      return true;
    }

    if (!syncStatus.isOnline || !user?.id) { // Use user?.id from context
      setSyncStatus(prev => ({ ...prev, error: 'No internet connection or user not authenticated' }));
      return false;
    }

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const { data: cloudData, error: fetchError } = await supabase
        .from('cloud_sync_data')
        .select('*')
        .eq('user_id', user.id) // Use user.id from context
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!cloudData) {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: 'No cloud data found for this user'
        }));
        return false;
      }

      const localLastSync = localStorage.getItem('ksm_last_cloud_sync');
      if (localLastSync && new Date(cloudData.updated_at) <= new Date(localLastSync)) {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: 'Local data is already up to date'
        }));
        return false;
      }

      const backupData: Record<string, any> = {};
      Object.keys(cloudData.data).forEach(key => {
        const currentData = localStorage.getItem(key);
        if (currentData) {
          backupData[key] = currentData;
        }
      });

      localStorage.setItem('ksm_data_backup_before_update', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: backupData
      }));

      Object.entries(cloudData.data).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.warn(`Failed to update key ${key}:`, error);
        }
      });

      localStorage.setItem('ksm_last_cloud_sync', cloudData.updated_at);

      const updateEvent: SyncEvent = {
        type: 'data_updated',
        deviceId: cloudData.device_id,
        timestamp: cloudData.updated_at,
        data: { updatedKeys: Object.keys(cloudData.data) }
      };

      localStorage.setItem('ksm_sync_event', JSON.stringify(updateEvent));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'ksm_sync_event',
        newValue: JSON.stringify(updateEvent)
      }));

      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: cloudData.updated_at,
        error: null,
        lastUpdateFrom: cloudData.device_id,
        pendingChanges: 0
      }));

      console.log('✅ Data updated from Supabase cloud successfully at:', new Date(cloudData.updated_at).toLocaleString());

      // Reload window to reflect changes from cloud
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;

    } catch (error: any) {
      console.error('Update from cloud failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: error.message || 'Failed to update from cloud'
      }));
      return false;
    }
  }, [syncStatus.isOnline, user?.id, isAuthenticated, authLoading]); // Added auth-related dependencies

  useEffect(() => {
    if (typeof window !== 'undefined') { // Only run on client-side
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'ksm_sync_event' && e.newValue) {
          try {
            const syncEvent: SyncEvent = JSON.parse(e.newValue);

            if (syncEvent.deviceId !== syncStatus.deviceId) {
              setSyncStatus(prev => ({
                ...prev,
                lastUpdateFrom: syncEvent.deviceId,
                lastSync: syncEvent.timestamp
              }));

              if (syncEvent.type === 'data_updated') {
                console.log(`📱 Data updated by ${syncEvent.deviceId} at ${new Date(syncEvent.timestamp).toLocaleString()}`);
              }
            }
          } catch (error) {
            console.error('Error parsing sync event:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [syncStatus.deviceId]);

  useEffect(() => {
    if (typeof window !== 'undefined') { // Only run on client-side
      const handleFocus = () => {
        if (syncStatus.isOnline && isAuthenticated && user) {
          setTimeout(() => {
            updateFromCloud();
          }, 2000);
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [syncStatus.isOnline, isAuthenticated, user, updateFromCloud]);

  const getSyncStats = useCallback(async () => {
    if (!user?.id) { // Use user?.id from context
      return {
        totalItems: 0,
        lastUpdate: null,
        deviceCount: 0,
        dataSize: 0
      };
    }

    try {
      const { data: cloudData, error } = await supabase
        .from('cloud_sync_data')
        .select('*')
        .eq('user_id', user.id) // Use user.id from context
        .maybeSingle();

      if (error || !cloudData) {
        return {
          totalItems: 0,
          lastUpdate: null,
          deviceCount: 0,
          dataSize: 0
        };
      }

      const totalItems = Object.values(cloudData.data).reduce((sum: number, items) => {
        return sum + (Array.isArray(items) ? items.length : 0);
      }, 0);

      const deviceRegistry = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('ksm_device_registry') || '[]') : [];
      const dataSize = new Blob([JSON.stringify(cloudData.data)]).size;

      return {
        totalItems,
        lastUpdate: cloudData.updated_at,
        deviceCount: deviceRegistry.length,
        dataSize: Math.round(dataSize / 1024)
      };
    } catch {
      return {
        totalItems: 0,
        lastUpdate: null,
        deviceCount: 0,
        dataSize: 0
      };
    }
  }, [user?.id]); // Added user?.id to dependencies

  const forceSyncAll = useCallback(async (): Promise<boolean> => {
    const collections = [
      'customers', 'catering-items', 'decor-items', 'sanitation-items',
      'entertainment-equipment', 'djmc-bookings', 'gym-finances',
      'gym-members', 'sauna-bookings', 'spa-bookings', 'restaurant-sales'
    ];

    collections.forEach(collection => {
      changeTrackingRef.current.add(`${collection}_force_sync`);
    });

    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: changeTrackingRef.current.size
    }));

    return await syncToCloud();
  }, [syncToCloud]);

  const clearSyncData = useCallback(async () => {
    if (user?.id) { // Use user?.id from context
      try {
        await supabase
          .from('cloud_sync_data')
          .delete()
          .eq('user_id', user.id); // Use user.id from context

        if (typeof localStorage !== 'undefined') { // Handle SSR
          localStorage.removeItem('ksm_last_cloud_sync');
        }
        changeTrackingRef.current.clear();

        setSyncStatus(prev => ({
          ...prev,
          lastSync: null,
          pendingChanges: 0,
          error: null
        }));
      } catch (error) {
        console.error('Failed to clear sync data:', error);
      }
    }
  }, [user?.id]); // Added user?.id to dependencies

  return {
    syncStatus,
    trackDataChange,
    syncToCloud,
    updateFromCloud,
    getSyncStats,
    forceSyncAll,
    clearSyncData
  };
};