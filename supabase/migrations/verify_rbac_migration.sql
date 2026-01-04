-- Verification Script
-- Run this to confirm the migration was successful

SELECT 
    tc.table_name, 
    tc.constraint_name, 
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('restaurant_sales', 'gym_finances', 'sauna_spa_finances')
    AND ccu.column_name = 'id' -- The referenced column
    AND tc.constraint_name LIKE '%user_id_fkey';
