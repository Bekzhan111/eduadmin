-- Fix Registration Issue: Authors being created as students
-- This script addresses the core issues causing authors to be registered as students

-- 1. First, let's add a function to generate author keys properly
CREATE OR REPLACE FUNCTION public.generate_author_keys(
  creator_id UUID,
  count INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  keys_created INTEGER := 0;
  key_code TEXT;
  expires_date TIMESTAMP;
  generated_keys TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check user permissions (only super admins can create author keys)
  SELECT role INTO user_role
  FROM users
  WHERE id = creator_id;
  
  IF user_role != 'super_admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only super administrators can generate author keys'
    );
  END IF;
  
  -- Set expiration date (30 days from now)
  expires_date := NOW() + INTERVAL '30 days';
  
  -- Generate the specified number of keys
  FOR i IN 1..count LOOP
    -- Generate a secure random key with AUTHOR prefix
    key_code := 'AUTHOR-' || UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8)
    );
    
    -- Insert the key
    INSERT INTO registration_keys (
      key,
      role,
      school_id,
      created_by,
      is_active,
      max_uses,
      uses,
      expires_at
    ) VALUES (
      key_code,
      'author',       -- This is the critical line - ensuring role is 'author'
      NULL,           -- Authors are not tied to schools
      creator_id,
      true,
      1,              -- Single use key
      0,
      expires_date
    );
    
    generated_keys := array_append(generated_keys, key_code);
    keys_created := keys_created + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Author keys generated successfully',
    'keys_created', keys_created,
    'keys', generated_keys
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. Add a function to verify and audit registration keys
CREATE OR REPLACE FUNCTION public.audit_registration_keys()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_keys INTEGER;
  active_keys INTEGER;
  author_keys INTEGER;
  student_keys INTEGER;
  teacher_keys INTEGER;
  school_keys INTEGER;
  moderator_keys INTEGER;
  expired_keys INTEGER;
  used_keys INTEGER;
  result JSON;
BEGIN
  -- Count total keys
  SELECT COUNT(*) INTO total_keys FROM registration_keys;
  
  -- Count active keys
  SELECT COUNT(*) INTO active_keys FROM registration_keys WHERE is_active = true;
  
  -- Count by role
  SELECT COUNT(*) INTO author_keys FROM registration_keys WHERE role = 'author';
  SELECT COUNT(*) INTO student_keys FROM registration_keys WHERE role = 'student';
  SELECT COUNT(*) INTO teacher_keys FROM registration_keys WHERE role = 'teacher';
  SELECT COUNT(*) INTO school_keys FROM registration_keys WHERE role = 'school';
  SELECT COUNT(*) INTO moderator_keys FROM registration_keys WHERE role = 'moderator';
  
  -- Count expired keys
  SELECT COUNT(*) INTO expired_keys FROM registration_keys WHERE expires_at < NOW();
  
  -- Count used keys
  SELECT COUNT(*) INTO used_keys FROM registration_keys WHERE uses >= max_uses;
  
  result := json_build_object(
    'total_keys', total_keys,
    'active_keys', active_keys,
    'expired_keys', expired_keys,
    'used_keys', used_keys,
    'roles', json_build_object(
      'author', author_keys,
      'student', student_keys,
      'teacher', teacher_keys,
      'school', school_keys,
      'moderator', moderator_keys
    )
  );
  
  RETURN result;
END;
$$;

-- 3. Add a function to check if a registration key is valid and what role it provides
CREATE OR REPLACE FUNCTION public.validate_registration_key(
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
      'error', 'Registration key not found'
    );
  END IF;
  
  -- Check if key is valid
  IF NOT key_record.is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key is inactive'
    );
  END IF;
  
  IF key_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key has expired'
    );
  END IF;
  
  IF key_record.uses >= key_record.max_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Registration key has been used up'
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

-- 4. Update the create_registration_key function to ensure it handles all roles correctly
CREATE OR REPLACE FUNCTION public.create_registration_key(
  creator_id UUID,
  role TEXT,
  school_id UUID DEFAULT NULL,
  max_uses INTEGER DEFAULT 1,
  expires_in INTERVAL DEFAULT '30 days'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key TEXT;
  creator_role TEXT;
  key_prefix TEXT;
  result JSON;
BEGIN
  -- Get creator's role
  SELECT users.role INTO creator_role 
  FROM users 
  WHERE users.id = creator_id;
  
  -- Check permissions
  IF creator_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Creator not found');
  END IF;
  
  -- Super admins can create any key type
  IF creator_role = 'super_admin' THEN
    -- Allow all key types
    NULL;
  -- School admins can only create teacher/student keys for their school
  ELSIF creator_role = 'school' THEN
    IF role NOT IN ('teacher', 'student') THEN
      RETURN json_build_object('success', false, 'error', 'School admins can only create teacher and student keys');
    END IF;
    
    -- Get creator's school_id
    SELECT users.school_id INTO school_id 
    FROM users 
    WHERE users.id = creator_id;
    
    IF school_id IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'School admin must be associated with a school');
    END IF;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions to create registration keys');
  END IF;
  
  -- Validate role
  IF role NOT IN ('school', 'teacher', 'student', 'author', 'moderator') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role specified');
  END IF;
  
  -- Set key prefix based on role
  key_prefix := UPPER(role);
  
  -- Generate unique key with role prefix
  new_key := key_prefix || '-' || UPPER(
    SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
    SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8)
  );
  
  -- Insert the new registration key
  INSERT INTO registration_keys (
    key,
    role,
    school_id,
    is_active,
    max_uses,
    uses,
    expires_at,
    created_by,
    created_at
  ) VALUES (
    new_key,
    role,           -- This is critical - ensuring the role is set correctly
    school_id,
    true,
    max_uses,
    0,
    NOW() + expires_in,
    creator_id,
    NOW()
  );
  
  -- Return success with the new key
  RETURN json_build_object(
    'success', true, 
    'key', new_key,
    'role', role,
    'school_id', school_id,
    'max_uses', max_uses,
    'expires_at', NOW() + expires_in
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_author_keys(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_registration_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_registration_key(TEXT) TO authenticated;

-- 6. Add a view to easily check registration key statistics
CREATE OR REPLACE VIEW public.registration_key_summary AS
SELECT 
  role,
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE is_active = true) as active_keys,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_keys,
  COUNT(*) FILTER (WHERE uses >= max_uses) as used_keys,
  COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW() AND uses < max_uses) as available_keys
FROM registration_keys
GROUP BY role
ORDER BY role;

-- 7. Add RLS policy for the new view
ALTER TABLE registration_keys ENABLE ROW LEVEL SECURITY;

-- Grant permissions to view the summary
GRANT SELECT ON public.registration_key_summary TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.generate_author_keys(UUID, INTEGER) IS 'Generates author registration keys that can only be created by super admins';
COMMENT ON FUNCTION public.audit_registration_keys() IS 'Provides a comprehensive audit of all registration keys in the system';
COMMENT ON FUNCTION public.validate_registration_key(TEXT) IS 'Validates a registration key and returns its details and validity status';
COMMENT ON VIEW public.registration_key_summary IS 'Summary view of registration keys grouped by role';