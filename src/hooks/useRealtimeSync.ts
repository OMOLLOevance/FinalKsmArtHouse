import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSyncStatus {
  connected: boolean;
  lastSync: string | null;
  syncing: boolean;
  error: string | null;
  deviceId: string;
}

export const useRealtimeSync = () => {
  const { user, isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>({
    connected: false,
    lastSync: null,
    syncing: false,
    error: null,
    deviceId: ''
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const syncQueueRef = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDeviceId = useCallback((): string => {
    let deviceId = localStorage.getItem('ksm_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ksm_device_id', deviceId);
    }
    return deviceId;
  }, []);

  const syncDataToSupabase = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const deviceId = getDeviceId();
      const timestamp = new Date().toISOString();

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
        'quotations'
      ];

      dataKeys.forEach(key => {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          try {
            allData[key] = JSON.parse(dataStr);
          } catch {
            allData[key] = dataStr;
          }
        }
      });

      const { error } = await supabase
        .from('cloud_sync_data')
        .upsert({
          user_id: user.id,
          data: allData,
          device_id: deviceId,
          version: '4.0',
          change_log: [{
            timestamp,
            device_id: deviceId,
            action: 'sync',
            collections: Object.keys(allData)
          }]
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      localStorage.setItem('ksm_last_cloud_sync', timestamp);

      return true;
    } catch (error: any) {
      console.error('Failed to sync to Supabase:', error);
      return false;
    }
  }, [user, getDeviceId]);

  const batchSyncAllData = useCallback(async () => {
    if (!user?.id || syncStatus.syncing) return false;

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const result = await syncDataToSupabase();

      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date().toISOString(),
        error: result ? null : 'Sync failed'
      }));

      if (result) {
        console.log('✅ All data synced to cloud successfully');
      }

      return result;
    } catch (error: any) {
      console.error('Batch sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: error.message || 'Failed to sync data'
      }));
      return false;
    }
  }, [user, syncStatus.syncing, syncDataToSupabase]);

  const loadDataFromSupabase = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const { data: cloudData, error } = await supabase
        .from('cloud_sync_data')
        .select('data, updated_at, device_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (cloudData && cloudData.data) {
        Object.entries(cloudData.data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });

        localStorage.setItem('ksm_last_cloud_sync', cloudData.updated_at);

        console.log(`📥 Loaded all data from device ${cloudData.device_id}`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Failed to load from Supabase:', error);
      return false;
    }
  }, [user]);

  const loadAllDataFromSupabase = useCallback(async () => {
    if (!user?.id) return false;

    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const result = await loadDataFromSupabase();

      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: result ? null : 'Load failed'
      }));

      if (result) {
        window.dispatchEvent(new CustomEvent('data-reloaded'));
      }

      return result;
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: error.message || 'Failed to load data'
      }));
      return false;
    }
  }, [user, loadDataFromSupabase]);

  const queueSync = useCallback((dataKey: string) => {
    // Removed automatic syncing to prevent loops
    syncQueueRef.current.add(dataKey);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setSyncStatus(prev => ({ ...prev, connected: false }));
      return;
    }

    const deviceId = getDeviceId();
    setSyncStatus(prev => ({ ...prev, deviceId, connected: true }));

    const channel = supabase.channel(`sync:${user.id}`, {
      config: {
        broadcast: { self: false },
        presence: { key: deviceId }
      }
    });

    channel
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cloud_sync_data',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;

            if (newData.device_id !== deviceId && newData.data) {
              const lastLocalSync = localStorage.getItem('ksm_last_cloud_sync');
              let shouldUpdate = true;

              if (lastLocalSync && new Date(newData.updated_at) <= new Date(lastLocalSync)) {
                shouldUpdate = false;
              }

              if (shouldUpdate) {
                Object.entries(newData.data).forEach(([key, value]: [string, any]) => {
                  localStorage.setItem(key, JSON.stringify(value));
                });

                localStorage.setItem('ksm_last_cloud_sync', newData.updated_at);

                setSyncStatus(prev => ({ ...prev, lastSync: newData.updated_at }));

                console.log(`📱 Real-time update from device ${newData.device_id}`);

                window.dispatchEvent(new CustomEvent('realtime-data-update', {
                  detail: { deviceId: newData.device_id, timestamp: newData.updated_at }
                }));

                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus(prev => ({ ...prev, connected: true, error: null }));
          console.log('🔄 Real-time sync active');

          // Initial load only, no continuous syncing
          loadAllDataFromSupabase();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setSyncStatus(prev => ({ ...prev, connected: true, error: null }));
          console.log('📱 Working in local mode');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, user, getDeviceId, loadAllDataFromSupabase]);

  useEffect(() => {
    // Removed continuous sync on visibility change to prevent loops
  }, [isAuthenticated, syncStatus.connected, loadAllDataFromSupabase]);

  return {
    syncStatus,
    syncDataToSupabase,
    batchSyncAllData,
    loadDataFromSupabase,
    loadAllDataFromSupabase,
    queueSync
  };
};
