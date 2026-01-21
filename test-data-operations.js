const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataOperations() {
  console.log('💾 TESTING DATA OPERATIONS...');
  
  try {
    // Test simple data retrieval first
    const { data: existingUsers, error: readError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (readError) throw readError;
    console.log('✅ Data read: SUCCESS');
    
    // Test customer retrieval
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (customerError) throw customerError;
    console.log('✅ Customer read: SUCCESS');
    
    // If we have existing users, test customer creation with existing user
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
    }
    
    return true;
  } catch (error) {
    console.log('❌ Data operations: FAILED -', error.message);
    return false;
  }
}

testDataOperations().then(success => {
  console.log(success ? '✅ DATA OPERATIONS: WORKING' : '❌ DATA OPERATIONS: FAILED');
  process.exit(success ? 0 : 1);
});