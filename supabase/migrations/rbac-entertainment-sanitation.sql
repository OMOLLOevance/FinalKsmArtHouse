-- Migration: RBAC Staff Filtering for Entertainment and Sanitation
-- Purpose: Extend attribution and filtering to these equipment tables.

BEGIN;

-- 1. Helper function (re-defined just in case, though it was in previous migration)
CREATE OR REPLACE FUNCTION update_fk_to_public_users(table_name text, constraint_name text)
RETURNS void AS $$
BEGIN
    -- Drop existing constraint if it exists
    EXECUTE 'ALTER TABLE public.' || table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_name;
    
    -- Add new constraint referencing public.users
    EXECUTE 'ALTER TABLE public.' || table_name || ' ADD CONSTRAINT ' || constraint_name || 
            ' FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE';
END;
$$ LANGUAGE plpgsql;

-- 2. Apply to Entertainment and Sanitation if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entertainment_equipment') THEN
        PERFORM update_fk_to_public_users('entertainment_equipment', 'entertainment_equipment_user_id_fkey');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sanitation_items') THEN
        PERFORM update_fk_to_public_users('sanitation_items', 'sanitation_items_user_id_fkey');
    END IF;
END $$;

-- 3. Update RLS for Entertainment
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entertainment_equipment') THEN
        DROP POLICY IF EXISTS "Staff can read own entertainment" ON public.entertainment_equipment;
        CREATE POLICY "Staff can read own entertainment" ON public.entertainment_equipment
          FOR SELECT USING (
            auth.uid() = user_id OR 
            get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
          );
    END IF;
END $$;

-- 4. Update RLS for Sanitation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sanitation_items') THEN
        DROP POLICY IF EXISTS "Staff can read own sanitation" ON public.sanitation_items;
        CREATE POLICY "Staff can read own sanitation" ON public.sanitation_items
          FOR SELECT USING (
            auth.uid() = user_id OR 
            get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
          );
    END IF;
END $$;

-- Clean up helper
DROP FUNCTION update_fk_to_public_users;

COMMIT;
