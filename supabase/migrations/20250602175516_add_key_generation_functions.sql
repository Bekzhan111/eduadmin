-- SQL script to create key generation functions that are missing in the database
-- These functions are called from the frontend but don't exist yet

-- Function to generate teacher keys
CREATE OR REPLACE FUNCTION public.generate_teacher_keys(
  creator_id UUID,
  target_school_id UUID,
  count INTEGER
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
BEGIN
  -- Check user permissions
  SELECT role INTO user_role
  FROM users
  WHERE id = creator_id;
  
  IF user_role NOT IN ('super_admin', 'school') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only super administrators and school administrators can generate teacher keys'
    );
  END IF;
  
  -- For school admins, they can only generate keys for their own school
  IF user_role = 'school' THEN
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = creator_id 
      AND school_id = target_school_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'School administrators can only generate keys for their own school'
      );
    END IF;
  END IF;
  
  -- Set expiration date (30 days from now)
  expires_date := NOW() + INTERVAL '30 days';
  
  -- Generate the specified number of keys
  FOR i IN 1..count LOOP
    -- Generate a secure random key
    key_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
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
      'teacher',
      target_school_id,
      creator_id,
      true,
      1,
      0,
      expires_date
    );
    
    keys_created := keys_created + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Teacher keys generated successfully',
    'keys_created', keys_created
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to generate student keys
CREATE OR REPLACE FUNCTION public.generate_student_keys(
  creator_id UUID,
  target_school_id UUID,
  count INTEGER
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
BEGIN
  -- Check user permissions
  SELECT role INTO user_role
  FROM users
  WHERE id = creator_id;
  
  IF user_role NOT IN ('super_admin', 'school') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only super administrators and school administrators can generate student keys'
    );
  END IF;
  
  -- For school admins, they can only generate keys for their own school
  IF user_role = 'school' THEN
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = creator_id 
      AND school_id = target_school_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'School administrators can only generate keys for their own school'
      );
    END IF;
  END IF;
  
  -- Set expiration date (30 days from now)
  expires_date := NOW() + INTERVAL '30 days';
  
  -- Generate the specified number of keys
  FOR i IN 1..count LOOP
    -- Generate a secure random key
    key_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
      SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8) ||
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
      'student',
      target_school_id,
      creator_id,
      true,
      1,
      0,
      expires_date
    );
    
    keys_created := keys_created + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Student keys generated successfully',
    'keys_created', keys_created
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_teacher_keys(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_student_keys(UUID, UUID, INTEGER) TO authenticated;
