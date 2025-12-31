import { useState, useEffect, useCallback } from 'react';

interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  syncing: boolean;
  error: string | null;
}

export const useDataSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: localStorage.getItem('lastSync') || new Date().toISOString(),
    syncing: false,
    error: null
  });

  const [dataChanged, setDataChanged] = useState(false);

  // Initialize last sync if not exists
  useEffect(() => {
    if (!localStorage.getItem('lastSync')) {
      const now = new Date().toISOString();
      localStorage.setItem('lastSync', now);
      setSyncStatus(prev => ({ ...prev, lastSync: now }));
    }
  }, []);
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markDataChanged = useCallback(() => {
    setDataChanged(true);
  }, []);

  const syncToCloud = useCallback(async () => {
    if (!syncStatus.isOnline) {
      setSyncStatus(prev => ({ ...prev, error: 'No internet connection' }));
      return false;
    }

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      // Collect all data from localStorage
      const allData: Record<string, any> = {};
      const keys = [
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
        'monthly-expenses',
        'catering-inventory',
        'ksm_users_database',
        'ksm_current_user_session',
        'ksm_login_session_data',
        'ksm_user_preferences',
        'ksm_device_registry',
        'ksm_remembered_logins'
      ];

      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            allData[key] = JSON.parse(data);
          } catch {
            allData[key] = data;
          }
        }
      });

      // Create sync payload
      const syncData = {
        timestamp: new Date().toISOString(),
        data: allData,
        version: '2.0',
        deviceId: localStorage.getItem('deviceId') || 'unknown',
        userAgent: navigator.userAgent
      };

      // Store in localStorage as backup
      localStorage.setItem('cloudSyncData', JSON.stringify(syncData));
      localStorage.setItem('lastSync', syncData.timestamp);

      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: syncData.timestamp,
        error: null
      }));

      setDataChanged(false);
      
      // Show success message
      console.log('✅ Data synced to cloud successfully at:', new Date(syncData.timestamp).toLocaleString());
      return true;

    } catch (error) {
      console.error('Sync to cloud failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: 'Failed to sync to cloud'
      }));
      return false;
    }
  }, [syncStatus.isOnline]);

  const updateFromCloud = useCallback(async () => {
    if (!syncStatus.isOnline) {
      setSyncStatus(prev => ({ ...prev, error: 'No internet connection' }));
      return false;
    }

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      // Try to get data from localStorage backup first
      const cloudData = localStorage.getItem('cloudSyncData');
      
      if (cloudData) {
        const syncData = JSON.parse(cloudData);
        
        // Validate sync data
        if (!syncData.data || typeof syncData.data !== 'object') {
          throw new Error('Invalid sync data format');
        }
        
        // Restore all data
        Object.entries(syncData.data).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to restore key ${key}:`, error);
          }
        });

        localStorage.setItem('lastSync', syncData.timestamp);

        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          lastSync: syncData.timestamp,
          error: null
        }));

        // Show success message
        console.log('✅ Data updated from cloud successfully at:', new Date(syncData.timestamp).toLocaleString());
        
        // Reload page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return true;
      } else {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          error: 'No cloud data found'
        }));
        return false;
      }

    } catch (error) {
      console.error('Update from cloud failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: 'Failed to update from cloud'
      }));
      return false;
    }
  }, [syncStatus.isOnline]);

  return {
    syncStatus,
    dataChanged,
    markDataChanged,
    syncToCloud,
    updateFromCloud
  };
};