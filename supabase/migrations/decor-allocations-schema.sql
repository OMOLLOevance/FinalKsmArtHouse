-- Decor Allocations Table Schema
CREATE TABLE IF NOT EXISTS decor_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    row_number INTEGER NOT NULL,
    
    -- Decor Items
    walkway_stands INTEGER DEFAULT 0,
    arc INTEGER DEFAULT 0,
    aisle_stands INTEGER DEFAULT 0,
    photobooth INTEGER DEFAULT 0,
    lecturn INTEGER DEFAULT 0,
    stage_boards INTEGER DEFAULT 0,
    backdrop_boards INTEGER DEFAULT 0,
    dance_floor INTEGER DEFAULT 0,
    walkway_boards INTEGER DEFAULT 0,
    white_sticker INTEGER DEFAULT 0,
    centerpieces INTEGER DEFAULT 0,
    glass_charger_plates INTEGER DEFAULT 0,
    melamine_charger_plates INTEGER DEFAULT 0,
    african_mats INTEGER DEFAULT 0,
    gold_napkin_holders INTEGER DEFAULT 0,
    silver_napkin_holders INTEGER DEFAULT 0,
    roof_top_decor INTEGER DEFAULT 0,
    
    -- Lighting Items
    parcan_lights INTEGER DEFAULT 0,
    revolving_heads INTEGER DEFAULT 0,
    fairy_lights INTEGER DEFAULT 0,
    snake_lights INTEGER DEFAULT 0,
    neon_lights INTEGER DEFAULT 0,
    small_chandeliers INTEGER DEFAULT 0,
    large_chandeliers INTEGER DEFAULT 0,
    african_lampshades INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(month, year, row_number, user_id)
);

-- Enable RLS
ALTER TABLE decor_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own decor allocations" ON decor_allocations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decor allocations" ON decor_allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decor allocations" ON decor_allocations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decor allocations" ON decor_allocations
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_decor_allocations_month_year ON decor_allocations(month, year);
CREATE INDEX idx_decor_allocations_user_id ON decor_allocations(user_id);