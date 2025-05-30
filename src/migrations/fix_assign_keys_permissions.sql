-- Fix assign_student_keys_to_teacher function to allow super_admin role
-- This migration updates the function to allow both 'super_admin' and 'school' roles to assign student keys to teachers

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.assign_student_keys_to_teacher(UUID, UUID, INTEGER);

-- Create the updated function with proper permissions
CREATE OR REPLACE FUNCTION public.assign_student_keys_to_teacher(
  admin_id UUID,
  target_teacher_id UUID,
  key_count INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
  admin_school_id UUID;
  teacher_school_id UUID;
  assigned_count INTEGER := 0;
  key_record RECORD;
BEGIN
  -- Get admin user info
  SELECT role, school_id INTO admin_role, admin_school_id
  FROM users WHERE id = admin_id;
  
  -- Check if user has permission to assign keys
  IF admin_role NOT IN ('super_admin', 'school') THEN
    RAISE EXCEPTION 'Only super administrators and school administrators can assign student keys';
  END IF;
  
  -- Get teacher's school
  SELECT school_id INTO teacher_school_id
  FROM users WHERE id = target_teacher_id AND role = 'teacher';
  
  IF teacher_school_id IS NULL THEN
    RAISE EXCEPTION 'Teacher not found or invalid teacher ID';
  END IF;
  
  -- For school admins, ensure they can only assign keys in their own school
  IF admin_role = 'school' AND admin_school_id != teacher_school_id THEN
    RAISE EXCEPTION 'School administrators can only assign keys to teachers in their own school';
  END IF;
  
  -- For super_admin, they can assign keys to any teacher in any school
  -- For school admins, they can only assign keys in their own school (already checked above)
  
  -- Find and assign available student keys
  FOR key_record IN 
    SELECT id FROM registration_keys 
    WHERE role = 'student' 
      AND school_id = teacher_school_id
      AND teacher_id IS NULL 
      AND is_active = true 
      AND uses < max_uses
    ORDER BY created_at
    LIMIT key_count
  LOOP
    UPDATE registration_keys 
    SET teacher_id = target_teacher_id 
    WHERE id = key_record.id;
    
    assigned_count := assigned_count + 1;
  END LOOP;
  
  IF assigned_count = 0 THEN
    RAISE EXCEPTION 'No available student keys found for assignment';
  END IF;
  
  RETURN assigned_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_student_keys_to_teacher(UUID, UUID, INTEGER) TO authenticated; 