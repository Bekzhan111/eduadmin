-- Fix register_with_key function conflict
-- This script drops all conflicting versions and creates a single correct version

-- Step 1: Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.register_with_key(uuid, text, text);
DROP FUNCTION IF EXISTS public.register_with_key(text, uuid, text);
DROP FUNCTION IF EXISTS public.register_with_key(registration_key text, user_id uuid, display_name text);
DROP FUNCTION IF EXISTS public.register_with_key(user_id uuid, registration_key text, display_name text);

-- Step 2: Create the auth.email() helper function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (auth.jwt() -> 'user_metadata' ->> 'email'),
    ''
  );
$$;

-- Step 3: Create the correct register_with_key function
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
  
  -- Insert new user
  INSERT INTO users (
    id,
    email,
    display_name,
    role,
    school_id,
    teacher_id,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    auth.email(),
    display_name,
    key_record.role,
    key_record.school_id,
    key_record.teacher_id,
    NOW(),
    NOW()
  );
  
  -- Update registration key usage
  UPDATE registration_keys
  SET uses = uses + 1,
      updated_at = NOW()
  WHERE key = registration_key;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User registered successfully',
    'role', key_record.role
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_with_key(text, uuid, text) TO authenticated; 