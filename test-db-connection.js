const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('✅ Users table accessible');
    
    // Test other core tables
    const tables = ['customers', 'gym_members', 'gym_finances', 'restaurant_sales', 'sauna_bookings'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('id').limit(1);
        if (tableError) {
          console.log(`⚠️  Table '${table}': ${tableError.message}`);
        } else {
          console.log(`✅ Table '${table}': Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': Error - ${err.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});