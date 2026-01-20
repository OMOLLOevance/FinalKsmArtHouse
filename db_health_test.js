
import { checkDatabaseHealth } from './src/lib/supabase.ts';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testDbHealth() {
  console.log('Checking database health...');
  const health = await checkDatabaseHealth();
  console.log(health);
}

testDbHealth();
