-- KSM ART HOUSE: SANITATION ASSET SEED DATA
-- Purpose: Pre-populates the dropdown list with professional sanitation items.
-- Run this in the Supabase SQL Editor.

INSERT INTO public.sanitation_items (name, category, quantity, unit, price, status)
VALUES 
('Hand Sanitizer (Alcohol Based)', 'sanitation', 0, 'Bottle', 450, 'in-store'),
('Hand Sanitizer (5L Refill)', 'sanitation', 0, 'Jerrycan', 2800, 'in-store'),
('Liquid Hand Wash (Premium)', 'sanitation', 0, 'Bottle', 350, 'in-store'),
('Liquid Soap (5L Refill)', 'sanitation', 0, 'Jerrycan', 1500, 'in-store'),
('Paper Towels (C-Fold Pack)', 'sanitation', 0, 'Pack', 650, 'in-store'),
('Toilet Tissue (Premium 2-Ply)', 'sanitation', 0, 'Pack', 800, 'in-store'),
('Jumbo Toilet Roll', 'sanitation', 0, 'Roll', 400, 'in-store'),
('Antibacterial Surface Wipes', 'sanitation', 0, 'Pack', 550, 'in-store'),
('Floor Cleaner (Disinfectant)', 'sanitation', 0, 'Bottle', 900, 'in-store'),
('Bleach / JIK (5L)', 'sanitation', 0, 'Jerrycan', 1100, 'in-store'),
('Glass & Mirror Cleaner', 'sanitation', 0, 'Bottle', 450, 'in-store'),
('Multi-Surface Polish', 'sanitation', 0, 'Can', 600, 'in-store'),
('Garbage Bags (Black - Large)', 'sanitation', 0, 'Roll', 750, 'in-store'),
('Garbage Bags (Small Bin)', 'sanitation', 0, 'Roll', 350, 'in-store'),
('Air Freshener (Automatic Refill)', 'sanitation', 0, 'Can', 850, 'in-store'),
('Industrial Mop Head', 'sanitation', 0, 'Piece', 400, 'in-store'),
('Nitrile Gloves (Box of 100)', 'sanitation', 0, 'Box', 1200, 'in-store'),
('Heavy Duty Scouring Pads', 'sanitation', 0, 'Pack', 250, 'in-store'),
('Microfiber Cleaning Cloths', 'sanitation', 0, 'Pack', 500, 'in-store'),
('Urinal Deodorizer Blocks', 'sanitation', 0, 'Pack', 950, 'in-store');
