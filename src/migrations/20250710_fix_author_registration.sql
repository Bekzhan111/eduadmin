-- Migration: Fix Author Registration Issue
-- Date: 2025-07-10
-- Description: This migration fixes the issue where authors are being created as students

-- Step 1: Add comprehensive registration key validation
CREATE OR REPLACE FUNCTION public.validate_registration_key_strict(
  key_to_check TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record RECORD;
  result JSON;
BEGIN
  -- Get key details
  SELECT 
    key,
    role,
    school_id,
    teacher_id,
    is_active,
    max_uses,
    uses,
    expires_at,
    created_by,
    created_at
  INTO key_record
  FROM registration_keys
  WHERE key = key_to_check;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key not found',
      'code', 'KEY_NOT_FOUND'
    );
  END IF;
  
  -- Check if key is valid
  IF NOT key_record.is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key is inactive',
      'code', 'KEY_INACTIVE'
    );
  END IF;
  
  IF key_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key has expired',
      'code', 'KEY_EXPIRED'
    );
  END IF;
  
  IF key_record.uses >= key_record.max_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key has been used up',
      'code', 'KEY_USED_UP'
    );
  END IF;
  
  -- Additional validation for role consistency
  IF key_record.role = 'author' AND (key_record.school_id IS NOT NULL OR key_record.teacher_id IS NOT NULL) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Author key should not have school or teacher associations',
      'code', 'INVALID_AUTHOR_KEY'
    );
  END IF;
  
  IF key_record.role IN ('student', 'teacher') AND key_record.school_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student and teacher keys must have school association',
      'code', 'MISSING_SCHOOL_ASSOCIATION'
    );
  END IF;
  
  -- Key is valid, return details
  RETURN json_build_object(
    'success', true,
    'key', key_record.key,
    'role', key_record.role,
    'school_id', key_record.school_id,
    'teacher_id', key_record.teacher_id,
    'uses_remaining', key_record.max_uses - key_record.uses,
    'expires_at', key_record.expires_at,
    'created_at', key_record.created_at
  );
END;
$$;

-- Step 2: Update the registration function to add more validation
CREATE OR REPLACE FUNCTION public.register_with_key_validated(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_validation JSON;
  key_record RECORD;
  user_record RECORD;
  result json;
  user_email text;
BEGIN
  -- Step 1: Validate the registration key using our strict validation
  SELECT public.validate_registration_key_strict(registration_key) INTO key_validation;
  
  -- Check if key validation failed
  IF NOT (key_validation->>'success')::boolean THEN
    RETURN key_validation;
  END IF;
  
  -- Step 2: Get the actual key record
  SELECT * INTO key_record
  FROM registration_keys
  WHERE key = registration_key;
  
  -- Step 3: Check if user already exists
  SELECT * INTO user_record
  FROM users
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already registered',
      'code', 'USER_EXISTS'
    );
  END IF;
  
  -- Step 4: Get user email from auth system
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in authentication system',
      'code', 'AUTH_USER_NOT_FOUND'
    );
  END IF;
  
  -- Step 5: Insert new user with explicit role validation
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
    user_email,
    display_name,
    key_record.role,  -- CRITICAL: This ensures the role from the key is used
    key_record.school_id,
    key_record.teacher_id,
    NOW(),
    NOW()
  );
  
  -- Step 6: Update registration key usage
  UPDATE registration_keys
  SET uses = uses + 1,
      updated_at = NOW()
  WHERE key = registration_key;
  
  -- Step 7: Log the registration for audit purposes
  INSERT INTO user_registration_log (
    user_id,
    registration_key,
    role_assigned,
    school_id,
    registered_at
  ) VALUES (
    user_id,
    registration_key,
    key_record.role,
    key_record.school_id,
    NOW()
  ) ON CONFLICT DO NOTHING;  -- In case the table doesn't exist yet
  
  RETURN json_build_object(
    'success', true,
    'message', 'User registered successfully',
    'role', key_record.role,
    'school_id', key_record.school_id,
    'user_id', user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'REGISTRATION_ERROR'
    );
END;
$$;

-- Step 3: Create audit table for registration events (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_registration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  registration_key TEXT NOT NULL,
  role_assigned TEXT NOT NULL,
  school_id UUID,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_registration_log_user_id ON public.user_registration_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registration_log_registered_at ON public.user_registration_log(registered_at);

-- Step 5: Add RLS policy for registration log
ALTER TABLE public.user_registration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registration log"
ON public.user_registration_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all registration logs"
ON public.user_registration_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_registration_key_strict(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_with_key_validated(TEXT, UUID, TEXT) TO authenticated;
GRANT SELECT ON public.user_registration_log TO authenticated;

-- Step 7: Add helpful views
CREATE OR REPLACE VIEW public.recent_registrations AS
SELECT 
  u.id,
  u.email,
  u.display_name,
  u.role,
  u.school_id,
  u.created_at,
  rl.registration_key,
  rl.registered_at
FROM users u
LEFT JOIN user_registration_log rl ON u.id = rl.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

GRANT SELECT ON public.recent_registrations TO authenticated;

-- Step 8: Add constraint to prevent role mismatches
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_user_role_valid 
CHECK (role IN ('super_admin', 'school', 'teacher', 'student', 'author', 'moderator'));

-- Step 9: Add comments for documentation
COMMENT ON FUNCTION public.validate_registration_key_strict(TEXT) IS 'Strict validation of registration keys with comprehensive error codes';
COMMENT ON FUNCTION public.register_with_key_validated(TEXT, UUID, TEXT) IS 'Registration function with enhanced validation and audit logging';
COMMENT ON TABLE public.user_registration_log IS 'Audit log for all user registrations';
COMMENT ON VIEW public.recent_registrations IS 'View of recent user registrations with their registration keys';

-- Step 10: Migration complete message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. Author registration issue should now be resolved.';
  RAISE NOTICE 'Key functions added: validate_registration_key_strict, register_with_key_validated';
  RAISE NOTICE 'Audit table created: user_registration_log';
  RAISE NOTICE 'To test: Use the new register_with_key_validated function instead of register_with_key';
END $$;