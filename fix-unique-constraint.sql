-- Add unique constraint to existing table
-- Run this in Supabase SQL Editor

ALTER TABLE catering_inventory_data ADD CONSTRAINT catering_inventory_data_user_id_unique UNIQUE (user_id);

SELECT 'Unique constraint added successfully!' as result;