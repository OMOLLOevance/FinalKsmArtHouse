-- Create only the missing cloud_sync_data table
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

-- Create indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS cloud_sync_data_user_id_idx ON public.cloud_sync_data(user_id);
CREATE INDEX IF NOT EXISTS cloud_sync_data_device_id_idx ON public.cloud_sync_data(device_id);

-- Enable RLS
ALTER TABLE public.cloud_sync_data ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cloud_sync_data' AND policyname = 'Users can view their own sync data') THEN
        CREATE POLICY "Users can view their own sync data" ON public.cloud_sync_data FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cloud_sync_data' AND policyname = 'Users can insert their own sync data') THEN
        CREATE POLICY "Users can insert their own sync data" ON public.cloud_sync_data FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cloud_sync_data' AND policyname = 'Users can update their own sync data') THEN
        CREATE POLICY "Users can update their own sync data" ON public.cloud_sync_data FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cloud_sync_data' AND policyname = 'Users can delete their own sync data') THEN
        CREATE POLICY "Users can delete their own sync data" ON public.cloud_sync_data FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS handle_cloud_sync_data_updated_at ON public.cloud_sync_data;
CREATE TRIGGER handle_cloud_sync_data_updated_at
    BEFORE UPDATE ON public.cloud_sync_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cloud_sync_data;

-- Grant permissions
GRANT ALL ON public.cloud_sync_data TO authenticated;
GRANT ALL ON public.cloud_sync_data TO service_role;