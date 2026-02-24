import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx ts-node scripts/set-temp-password.ts <email>');
  process.exit(1);
}

const setTempPassword = async () => {
  console.log(`Setting temporary password for ${email}...`);
  
  try {
    // 1. Get user ID
    // Note: getUserByEmail is not available in all versions, using listUsers with filter
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // 2. Update password and metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: 'KsmHouse2026!',
        user_metadata: {
          ...user.user_metadata,
          must_change_password: true
        }
      }
    );

    if (updateError) throw updateError;

    console.log('Success! Password set to KsmHouse2026! and forced change enabled.');
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

setTempPassword();
