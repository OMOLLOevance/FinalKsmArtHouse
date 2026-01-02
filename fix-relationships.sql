-- Fix ambiguous foreign key relationships for customer_requirements
-- This script drops existing ambiguous constraints and recreates them with explicit names
-- to ensure PostgREST can detect the relationships correctly for embedding.

BEGIN;

-- Check if constraints exist and drop them to avoid duplication/ambiguity
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_requirements_customer_id_fkey' AND table_name = 'customer_requirements') THEN
        ALTER TABLE customer_requirements DROP CONSTRAINT customer_requirements_customer_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_requirements_decor_item_id_fkey' AND table_name = 'customer_requirements') THEN
        ALTER TABLE customer_requirements DROP CONSTRAINT customer_requirements_decor_item_id_fkey;
    END IF;
END $$;

-- Re-add constraints with explicit standard names that PostgREST likes
-- Relationship to customers table
ALTER TABLE customer_requirements
ADD CONSTRAINT customer_requirements_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;

-- Relationship to decor_inventory table
ALTER TABLE customer_requirements
ADD CONSTRAINT customer_requirements_decor_item_id_fkey
FOREIGN KEY (decor_item_id)
REFERENCES decor_inventory(id)
ON DELETE CASCADE;

COMMIT;

-- Verify the relationships are visible to PostgREST by reloading schema cache (handled by Supabase usually)
NOTIFY pgrst, 'reload schema';
