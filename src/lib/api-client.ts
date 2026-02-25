import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
// Removed tokenStorage as it's no longer used
import { logger } from './logger';
import { supabase } from './supabase';

class APIClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true // Enable cookies for same-origin requests
    });

    
    this.setupInterceptors();
  }
  
  private sessionPromise: Promise<any> | null = null;
  private isSigningOut = false;
  
  private setupInterceptors() {
    let cachedToken: string | null = null;
    let tokenExpiry: number = 0;

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const now = Math.floor(Date.now() / 1000);
        
        // Only fetch new session if we don't have a token or it's about to expire (within 60s)
        if (!cachedToken || tokenExpiry - now < 60) {
          try {
            // Use a shared promise to prevent concurrent getSession calls
            if (!this.sessionPromise) {
              this.sessionPromise = supabase.auth.getSession();
            }
            
            const { data } = await this.sessionPromise;
            // Clear promise after resolution
            this.sessionPromise = null;
            
            cachedToken = data.session?.access_token || null;
            tokenExpiry = data.session?.expires_at || 0;
          } catch (e) {
            this.sessionPromise = null;
            logger.error('Error in request interceptor fetching session:', e);
          }
        }
        
        if (cachedToken) {
          config.headers.Authorization = `Bearer ${cachedToken}`;
        }
        // Ensure cookies are included for authentication
        config.withCredentials = true; 
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const message = error.response?.data?.message || error.response?.data?.error || 'Network error';
        
        // Handle Network Errors (no response) gracefully
        if (!error.response) {
            logger.warn(`API Network Error: ${error.message} - ${error.config?.url}`);
            // Don't toast for network errors to avoid spam during reloads/connection issues
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - always clear session and redirect to login
        if (error.response?.status === 401) {
          logger.warn(`API Unauthorized: ${error.config?.url} - aggressively clearing session and redirecting to login`);
          if (typeof window !== 'undefined' && !this.isSigningOut) {
            this.isSigningOut = true;
            try {
              await supabase.auth.signOut(); 
            } catch (signOutError) {
              logger.error('Error during automatic sign out:', signOutError);
            }
            
            // Aggressively clear Supabase-related localStorage items
            for (const key in localStorage) {
              if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
                localStorage.removeItem(key);
                logger.info(`Cleared localStorage key: ${key}`);
              }
            }
            
            window.location.href = '/login';
          }
          return Promise.reject(error); // Reject to prevent further processing
        }

        logger.error(`API Error: ${error.response?.status || 'Network'} ${error.config?.url}`, { message, data: error.response?.data });
        toast.error(message);
        
        return Promise.reject(error);
      }
    );
  }
  
  // The handleTokenRefresh method is no longer needed as 401s are handled by aggressive clear
  
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }
  
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();