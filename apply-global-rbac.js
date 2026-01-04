const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SQL_SCRIPTS = [
  // 1. Function and Grants
  `CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,
  
  `GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;`,

  // 2. Customers
  `DROP POLICY IF EXISTS "Users can view own data" ON public.customers;`,
  `DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;`,
  `DROP POLICY IF EXISTS "customers_all" ON public.customers;`,
  `DROP POLICY IF EXISTS "RBAC read customers" ON public.customers;`,
  `DROP POLICY IF EXISTS "RBAC manage customers" ON public.customers;`,
  `CREATE POLICY "RBAC read customers" ON public.customers FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,
  `CREATE POLICY "RBAC manage customers" ON public.customers FOR ALL USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,

  // 3. Allocations
  `DROP POLICY IF EXISTS "Users can view their own allocations" ON public.monthly_allocations;`,
  `DROP POLICY IF EXISTS "Manage own monthly allocations" ON public.monthly_allocations;`,
  `DROP POLICY IF EXISTS "RBAC Select monthly_allocations" ON public.monthly_allocations;`,
  `DROP POLICY IF EXISTS "RBAC read allocations" ON public.monthly_allocations;`,
  `DROP POLICY IF EXISTS "RBAC manage allocations" ON public.monthly_allocations;`,
  `CREATE POLICY "RBAC read allocations" ON public.monthly_allocations FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,
  `CREATE POLICY "RBAC manage allocations" ON public.monthly_allocations FOR ALL USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,

  // 4. Gym Members
  `DROP POLICY IF EXISTS "Users can view own gym members" ON public.gym_members;`,
  `DROP POLICY IF EXISTS "Manage own gym members" ON public.gym_members;`,
  `DROP POLICY IF EXISTS "gym_members_all" ON public.gym_members;`,
  `DROP POLICY IF EXISTS "RBAC read gym members" ON public.gym_members;`,
  `DROP POLICY IF EXISTS "RBAC manage gym members" ON public.gym_members;`,
  `CREATE POLICY "RBAC read gym members" ON public.gym_members FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,
  `CREATE POLICY "RBAC manage gym members" ON public.gym_members FOR ALL USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,

  // 5. Sauna Bookings
  `DROP POLICY IF EXISTS "Users can view own sauna bookings" ON public.sauna_bookings;`,
  `DROP POLICY IF EXISTS "Manage own sauna bookings" ON public.sauna_bookings;`,
  `DROP POLICY IF EXISTS "sauna_bookings_select" ON public.sauna_bookings;`,
  `DROP POLICY IF EXISTS "RBAC read sauna bookings" ON public.sauna_bookings;`,
  `DROP POLICY IF EXISTS "RBAC manage sauna bookings" ON public.sauna_bookings;`,
  `CREATE POLICY "RBAC read sauna bookings" ON public.sauna_bookings FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,
  `CREATE POLICY "RBAC manage sauna bookings" ON public.sauna_bookings FOR ALL USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,

  // 6. Gym Finances
  `DROP POLICY IF EXISTS "Users can view own gym finances" ON public.gym_finances;`,
  `DROP POLICY IF EXISTS "Manage own gym finances" ON public.gym_finances;`,
  `DROP POLICY IF EXISTS "RBAC read gym finances" ON public.gym_finances;`,
  `DROP POLICY IF EXISTS "RBAC manage gym finances" ON public.gym_finances;`,
  `CREATE POLICY "RBAC read gym finances" ON public.gym_finances FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`,
  `CREATE POLICY "RBAC manage gym finances" ON public.gym_finances FOR ALL USING (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));`
];

async function applyGlobalFix() {
  console.log('🔧 Applying Global Organization-Wide RBAC Fix...');
  
  for (let i = 0; i < SQL_SCRIPTS.length; i++) {
    const statement = SQL_SCRIPTS[i];
    console.log(`⏳ Executing statement ${i + 1}/${SQL_SCRIPTS.length}...`);
    
    // We try to use RPC exec_sql. If it's not there, we'll inform the user.
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
    
    if (error) {
      if (error.message.includes('Could not find the function')) {
        console.error('❌ CRITICAL: The "exec_sql" function is missing in your Supabase database.');
        console.log('💡 Please go to the Supabase Dashboard -> SQL Editor and run the "supabase/migrations/global_rbac_fix.sql" file manually.');
        process.exit(1);
      }
      console.error(`⚠️ Error in statement ${i + 1}:`, error.message);
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }
  
  console.log('🎉 RBAC migration applied to database!');
}

applyGlobalFix();
