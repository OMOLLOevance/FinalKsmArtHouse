-- Add must_change_password column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Update the handle_new_user function to include must_change_password from metadata if present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, role, must_change_password)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        role = COALESCE(EXCLUDED.role, public.users.role),
        must_change_password = COALESCE(EXCLUDED.must_change_password, public.users.must_change_password);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
