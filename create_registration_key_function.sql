-- Create the missing registration key function
-- This function allows super admins to create registration keys

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
  
  -- Generate unique key
  new_key := UPPER(role) || '-' || ENCODE(gen_random_bytes(12), 'base64');
  new_key := REPLACE(new_key, '/', '');
  new_key := REPLACE(new_key, '+', '');
  new_key := REPLACE(new_key, '=', '');
  
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
    role,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_registration_key TO authenticated;

-- Add RLS policy for registration keys if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'registration_keys' 
    AND policyname = 'Users can view keys they created or are assigned to'
  ) THEN
    CREATE POLICY "Users can view keys they created or are assigned to"
    ON registration_keys FOR SELECT
    TO authenticated
    USING (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('super_admin', 'school')
      )
    );
  END IF;
END
$$;