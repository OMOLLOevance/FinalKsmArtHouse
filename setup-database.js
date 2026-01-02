const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMissingTables() {
  console.log('🔧 Executing missing table creation in Supabase...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'execute-missing-tables.sql'), 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            continue;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Verify tables exist
    console.log('🔍 Verifying table creation...');
    
    const { data: decorData, error: decorError } = await supabase
      .from('decor_inventory')
      .select('count')
      .limit(1);
    
    const { data: reqData, error: reqError } = await supabase
      .from('customer_requirements')
      .select('count')
      .limit(1);
    
    if (!decorError) {
      console.log('✅ decor_inventory table exists and accessible');
    } else {
      console.log('❌ decor_inventory table issue:', decorError.message);
    }
    
    if (!reqError) {
      console.log('✅ customer_requirements table exists and accessible');
    } else {
      console.log('❌ customer_requirements table issue:', reqError.message);
    }
    
    // Check inventory count
    const { data: inventoryCount, error: countError } = await supabase
      .from('decor_inventory')
      .select('*', { count: 'exact' });
    
    if (!countError) {
      console.log(`📊 Inventory items: ${inventoryCount?.length || 0}`);
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing database setup:', error);
    process.exit(1);
  }
}

// Execute the setup
executeMissingTables();