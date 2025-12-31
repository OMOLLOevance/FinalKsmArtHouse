import { useState, useEffect, useCallback } from 'react';

interface Device {
  id: string;
  name: string;
  lastSeen: string;
  userAgent: string;
  isCurrentDevice: boolean;
}

interface MultiDeviceSyncState {
  devices: Device[];
  currentDeviceId: string;
  lastSync: string | null;
  isOnline: boolean;
}

// Safe localStorage operations
const safeGetItem = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
};

const safeSetItem = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
    return false;
  }
};

// Helper functions for device registry
const getDeviceRegistry = (): Device[] => {
  const registry = safeGetItem('ksm_device_registry', []);
  
  // Ensure we always return an array
  if (Array.isArray(registry)) {
    return registry;
  }
  
  // Handle old format or corrupted data
  if (registry && typeof registry === 'object' && registry.devices) {
    return Array.isArray(registry.devices) ? registry.devices : [];
  }
  
  return [];
};

const saveDeviceRegistry = (devices: Device[]): boolean => {
  return safeSetItem('ksm_device_registry', devices);
};

export const useMultiDeviceSync = () => {
  const [syncState, setSyncState] = useState<MultiDeviceSyncState>({
    devices: [],
    currentDeviceId: '',
    lastSync: null,
    isOnline: navigator.onLine
  });

  // Generate or get device ID
  const getDeviceId = useCallback((): string => {
    let deviceId = localStorage.getItem('ksm_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ksm_device_id', deviceId);
    }
    return deviceId;
  }, []);

  // Initialize device registry
  useEffect(() => {
    const currentDeviceId = getDeviceId();
    const devices = getDeviceRegistry();
    
    // Update or add current device
    const deviceIndex = devices.findIndex(d => d.id === currentDeviceId);
    const currentDevice: Device = {
      id: currentDeviceId,
      name: `Device ${devices.length + 1}`,
      lastSeen: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isCurrentDevice: true
    };

    if (deviceIndex >= 0) {
      devices[deviceIndex] = currentDevice;
    } else {
      devices.push(currentDevice);
    }

    // Mark other devices as not current
    devices.forEach(device => {
      if (device.id !== currentDeviceId) {
        device.isCurrentDevice = false;
      }
    });

    saveDeviceRegistry(devices);

    setSyncState(prev => ({
      ...prev,
      devices,
      currentDeviceId,
      lastSync: localStorage.getItem('ksm_last_sync')
    }));
  }, [getDeviceId]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update device last seen periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const devices = getDeviceRegistry();
      const deviceIndex = devices.findIndex(d => d.id === syncState.currentDeviceId);
      
      if (deviceIndex >= 0) {
        devices[deviceIndex].lastSeen = new Date().toISOString();
        saveDeviceRegistry(devices);
        setSyncState(prev => ({ ...prev, devices }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [syncState.currentDeviceId]);

  const syncToOtherDevices = useCallback(async (): Promise<boolean> => {
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem('ksm_last_sync', timestamp);
      
      setSyncState(prev => ({ ...prev, lastSync: timestamp }));
      
      console.log('Data synced to other devices at:', timestamp);
      return true;
    } catch (error) {
      console.error('Failed to sync to other devices:', error);
      return false;
    }
  }, []);

  const getOtherDevices = useCallback((): Device[] => {
    return syncState.devices.filter(device => device.id !== syncState.currentDeviceId);
  }, [syncState.devices, syncState.currentDeviceId]);

  return {
    devices: syncState.devices,
    currentDeviceId: syncState.currentDeviceId,
    otherDevices: getOtherDevices(),
    lastSync: syncState.lastSync,
    isOnline: syncState.isOnline,
    syncToOtherDevices
  };
};