import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Optimized Supabase client with performance settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable for better performance
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'ksm-art-house@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit real-time events for better performance
    },
  },
})

// Connection health check with caching
let healthCheckCache: { status: boolean; timestamp: number } | null = null
const HEALTH_CHECK_CACHE_DURATION = 30000 // 30 seconds

export const checkDatabaseHealth = async () => {
  const now = Date.now()
  
  // Return cached result if still valid
  if (healthCheckCache && (now - healthCheckCache.timestamp) < HEALTH_CHECK_CACHE_DURATION) {
    return healthCheckCache.status
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    const isHealthy = !error
    
    // Cache the result
    healthCheckCache = { status: isHealthy, timestamp: now }
    
    return isHealthy
  } catch (error) {
    healthCheckCache = { status: false, timestamp: now }
    return false
  }
}