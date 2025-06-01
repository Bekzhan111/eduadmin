-- Fix register_with_key function conflict
-- This migration drops all conflicting versions and creates a single correct function

-- Drop all existing versions of the register_with_key function
DROP FUNCTION IF EXISTS public.register_with_key(text, uuid, text);
DROP FUNCTION IF EXISTS public.register_with_key(uuid, text, text);
DROP FUNCTION IF EXISTS public.register_with_key(registration_key text, user_id uuid, display_name text);
DROP FUNCTION IF EXISTS public.register_with_key(user_id uuid, registration_key text, display_name text);

-- Create the correct version of the function
CREATE OR REPLACE FUNCTION public.register_with_key(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record RECORD;
  user_record RECORD;
  result json;
BEGIN
  -- Check if the registration key exists and is valid
  SELECT * INTO key_record
  FROM registration_keys
  WHERE key = registration_key
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND uses < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired registration key'
    );
  END IF;

  -- Check if user already exists
  SELECT * INTO user_record
  FROM users
  WHERE id = user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already registered'
    );
  END IF;

  -- Insert the new user
  INSERT INTO users (
    id,
    email,
    display_name,
    role,
    school_id,
    created_at,
    updated_at
  )
  SELECT
    user_id,
    auth.email(),
    display_name,
    key_record.role,
    CASE 
      WHEN key_record.role IN ('teacher', 'student') THEN key_record.school_id
      ELSE NULL
    END,
    NOW(),
    NOW()
  FROM auth.users
  WHERE auth.users.id = user_id;

  -- Update the registration key usage
  UPDATE registration_keys
  SET uses = uses + 1,
      updated_at = NOW()
  WHERE key = registration_key;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', user_id,
    'role', key_record.role,
    'school_id', key_record.school_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_with_key(text, uuid, text) TO authenticated;

-- Create a helper function to get user email from auth
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$; 