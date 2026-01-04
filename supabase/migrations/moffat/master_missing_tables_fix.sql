-- KSM ART HOUSE: MASTER DATABASE TABLES & RBAC FIX
-- Location: supabase/migrations/moffat/master_missing_tables_fix.sql
-- Purpose: Creates missing tables (Sanitation, Entertainment, Cloud Sync) and ensures Management has full visibility.

BEGIN;

---------------------------------------------------------
-- 1. UTILITY: ROLE HELPER FUNCTION
---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

---------------------------------------------------------
-- 2. TABLE: ENTERTAINMENT EQUIPMENT
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entertainment_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'entertainment',
    quantity_available INTEGER DEFAULT 0,
    price NUMERIC DEFAULT 0,
    condition TEXT,
    notes TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.entertainment_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC read entertainment" ON public.entertainment_equipment;
CREATE POLICY "RBAC read entertainment" ON public.entertainment_equipment
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

DROP POLICY IF EXISTS "RBAC manage entertainment" ON public.entertainment_equipment;
CREATE POLICY "RBAC manage entertainment" ON public.entertainment_equipment
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- 3. TABLE: SANITATION ITEMS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sanitation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'sanitation',
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pieces',
    price NUMERIC DEFAULT 0,
    supplier TEXT,
    notes TEXT,
    status TEXT DEFAULT 'in-store',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sanitation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC read sanitation" ON public.sanitation_items;
CREATE POLICY "RBAC read sanitation" ON public.sanitation_items
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

DROP POLICY IF EXISTS "RBAC manage sanitation" ON public.sanitation_items;
CREATE POLICY "RBAC manage sanitation" ON public.sanitation_items
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- 4. TABLE: CLOUD SYNC DATA
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cloud_sync_data (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    device_id TEXT,
    version TEXT DEFAULT '4.0',
    change_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cloud_sync_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own cloud sync" ON public.cloud_sync_data;
CREATE POLICY "Manage own cloud sync" ON public.cloud_sync_data
FOR ALL USING (auth.uid() = user_id);

---------------------------------------------------------
-- 5. UPDATED_AT TRIGGERS
---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_entertainment_equipment_updated_at ON public.entertainment_equipment;
CREATE TRIGGER update_entertainment_equipment_updated_at
BEFORE UPDATE ON public.entertainment_equipment
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sanitation_items_updated_at ON public.sanitation_items;
CREATE TRIGGER update_sanitation_items_updated_at
BEFORE UPDATE ON public.sanitation_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cloud_sync_data_updated_at ON public.cloud_sync_data;
CREATE TRIGGER update_cloud_sync_data_updated_at
BEFORE UPDATE ON public.cloud_sync_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
