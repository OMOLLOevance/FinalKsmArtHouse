-- KSM Art House - Supabase Database Setup
-- Run this script in your Supabase SQL Editor

-- Create cloud_sync_data table for real-time synchronization
CREATE TABLE IF NOT EXISTS public.cloud_sync_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    device_id TEXT NOT NULL,
    version TEXT DEFAULT '4.0',
    change_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on user_id (one record per user)
CREATE UNIQUE INDEX IF NOT EXISTS cloud_sync_data_user_id_idx ON public.cloud_sync_data(user_id);

-- Create index on device_id for faster queries
CREATE INDEX IF NOT EXISTS cloud_sync_data_device_id_idx ON public.cloud_sync_data(device_id);

-- Enable Row Level Security
ALTER TABLE public.cloud_sync_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sync data" ON public.cloud_sync_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync data" ON public.cloud_sync_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync data" ON public.cloud_sync_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync data" ON public.cloud_sync_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_cloud_sync_data_updated_at
    BEFORE UPDATE ON public.cloud_sync_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.cloud_sync_data;

-- Grant necessary permissions
GRANT ALL ON public.cloud_sync_data TO authenticated;
GRANT ALL ON public.cloud_sync_data TO service_role;