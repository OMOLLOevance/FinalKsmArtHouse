const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mqnfdmdqfysqxxamgvwc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmZkbWRxZnlzcXh4YW1ndndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODY1MDcsImV4cCI6MjA4MjY2MjUwN30.sMqYbNbF8371DgcSjXMzwfI5vqX3tdwCzqfBIfaaH3w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    console.log('Database connection:', error ? 'FAILED' : 'SUCCESS');
    if (error) console.log('Database error:', error.message);
    
    // Test auth endpoint
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth service:', authError ? 'FAILED' : 'SUCCESS');
    if (authError) console.log('Auth error:', authError.message);
    
    // Test signup (this will fail but shows if endpoint is reachable)
    const { error: signupError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    console.log('Signup endpoint:', signupError ? `ERROR: ${signupError.message}` : 'SUCCESS');
    
  } catch (err) {
    console.error('Connection test failed:', err.message);
  }
}

testSupabase();