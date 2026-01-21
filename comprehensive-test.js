const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 KSM.ART HOUSE - COMPREHENSIVE SYSTEM VERIFICATION');
console.log('=====================================================');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('\n📊 TESTING DATABASE CONNECTION...');
  
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection: SUCCESS');
    return true;
  } catch (error) {
    console.log('❌ Database connection: FAILED -', error.message);
    return false;
  }
}

async function testAllTables() {
  console.log('\n📋 TESTING ALL TABLES...');
  
  const tables = [
    'users', 'customers', 'gym_members', 'gym_finances',
    'restaurant_sales', 'sauna_bookings', 'catering_inventory',
    'decor_inventory', 'decor_allocations', 'customer_requirements',
    'quotations', 'event_items', 'monthly_allocations', 'payments'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      results[table] = '✅ OK';
      console.log(`✅ ${table}: Accessible`);
    } catch (error) {
      results[table] = `❌ ${error.message}`;
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  return results;
}

async function testAPIEndpoints() {
  console.log('\n🌐 TESTING API ENDPOINTS...');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    '/api/test-db',
    '/api/customers',
    '/api/gym',
    '/api/restaurant',
    '/api/sauna',
    '/api/catering',
    '/api/quotations'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      results[endpoint] = `✅ ${response.status}`;
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      const status = error.response?.status || 'TIMEOUT';
      results[endpoint] = `❌ ${status}`;
      console.log(`❌ ${endpoint}: ${status} - ${error.message}`);
    }
  }
  
  return results;
}

async function testDataOperations() {
  console.log('\n💾 TESTING DATA OPERATIONS...');
  
  try {
    // Test reading existing data first
    const { data: existingUsers, error: readError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (readError) throw readError;
    console.log('✅ Data read: SUCCESS');
    
    // If we have existing users, test with them
    if (existingUsers && existingUsers.length > 0) {
      const testCustomer = {
        user_id: existingUsers[0].id,
        name: `Test Customer ${Date.now()}`,
        contact: '123456789',
        event_type: 'Test Event'
      };
      
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()
        .single();
      
      if (createError) throw createError;
      console.log('✅ Customer creation: SUCCESS');
      
      // Cleanup
      await supabase.from('customers').delete().eq('id', newCustomer.id);
      console.log('✅ Data cleanup: SUCCESS');
      
      return true;
    } else {
      console.log('⚠️  No existing users found - database needs setup');
      return false;
    }
  } catch (error) {
    console.log('❌ Data operations: FAILED -', error.message);
    return false;
  }
}

async function testRealTimeFeatures() {
  console.log('\n⚡ TESTING REAL-TIME FEATURES...');
  
  try {
    // Simple connection test without subscription
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    
    if (error) {
      console.log('❌ Real-time features: FAILED - Database connection error');
      return false;
    }
    
    // Test basic real-time capability
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          // Real-time event received
        }
      );
    
    // Subscribe and wait
    const subscribePromise = new Promise((resolve) => {
      channel.subscribe((status) => {
        resolve(status === 'SUBSCRIBED');
      });
    });
    
    // Wait for subscription with timeout
    const subscribed = await Promise.race([
      subscribePromise,
      new Promise(resolve => setTimeout(() => resolve(false), 3000))
    ]);
    
    await supabase.removeChannel(channel);
    
    if (subscribed) {
      console.log('✅ Real-time subscription: SUCCESS');
      return true;
    } else {
      console.log('❌ Real-time subscription: TIMEOUT (may work in production)');
      return false;
    }
  } catch (error) {
    console.log('❌ Real-time features: FAILED -', error.message);
    return false;
  }
}

async function generateHealthReport() {
  console.log('\n📊 GENERATING HEALTH REPORT...');
  
  const dbConnection = await testDatabaseConnection();
  const tableResults = await testAllTables();
  const apiResults = await testAPIEndpoints();
  const dataOps = await testDataOperations();
  const realTime = await testRealTimeFeatures();
  
  console.log('\n==========================================');
  console.log('🏥 SYSTEM HEALTH REPORT');
  console.log('==========================================');
  
  console.log(`Database Connection: ${dbConnection ? '✅ HEALTHY' : '❌ FAILED'}`);
  console.log(`Data Operations: ${dataOps ? '✅ HEALTHY' : '❌ FAILED'}`);
  console.log(`Real-time Features: ${realTime ? '✅ HEALTHY' : '❌ FAILED'}`);
  
  console.log('\nTable Status:');
  Object.entries(tableResults).forEach(([table, status]) => {
    console.log(`  ${table}: ${status}`);
  });
  
  console.log('\nAPI Endpoints:');
  Object.entries(apiResults).forEach(([endpoint, status]) => {
    console.log(`  ${endpoint}: ${status}`);
  });
  
  const healthScore = [dbConnection, dataOps, realTime].filter(Boolean).length;
  const tableScore = Object.values(tableResults).filter(s => s.includes('✅')).length;
  const apiScore = Object.values(apiResults).filter(s => s.includes('✅')).length;
  
  console.log('\n==========================================');
  console.log(`Overall Health Score: ${healthScore}/3 Core Systems`);
  console.log(`Table Health: ${tableScore}/${Object.keys(tableResults).length}`);
  console.log(`API Health: ${apiScore}/${Object.keys(apiResults).length}`);
  
  if (healthScore === 3 && tableScore >= 10 && apiScore >= 5) {
    console.log('🎉 SYSTEM STATUS: EXCELLENT');
  } else if (healthScore >= 2) {
    console.log('⚠️  SYSTEM STATUS: GOOD (Minor Issues)');
  } else {
    console.log('🚨 SYSTEM STATUS: CRITICAL (Needs Immediate Attention)');
  }
  
  console.log('==========================================');
}

// Run the comprehensive test
generateHealthReport().catch(console.error);