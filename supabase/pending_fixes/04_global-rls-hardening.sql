-- Global RLS Hardening for KSM.ART HOUSE
-- Run this in your Supabase SQL Editor to secure all tables and prevent 500 errors

-- Function to handle all table policy updates safely
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'customers', 'gym_members', 'gym_finances', 
        'restaurant_sales', 'sauna_bookings', 'event_items', 
        'catering_inventory', 'catering_items', 'decor_inventory', 
        'decor_allocations', 'sauna_spa_finances', 'customer_requirements'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Skip if table doesn't exist yet
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            -- Drop any existing generic policies
            EXECUTE format('DROP POLICY IF EXISTS "Manage own %I" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', t, t);
            
            -- Create new hardened policy
            EXECUTE format('CREATE POLICY "Robust manage own %I" ON public.%I 
                            FOR ALL TO authenticated 
                            USING (auth.uid() = user_id) 
                            WITH CHECK (auth.uid() = user_id)', t, t);
            
            RAISE NOTICE 'Hardened RLS for table: %', t;
        END IF;
    END LOOP;
END $$;

-- Special case for users table (id instead of user_id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Robust view own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Robust update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
