-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.register_user_with_key(text, text, uuid);
DROP FUNCTION IF EXISTS public.register_as_student(text, text, uuid);
DROP FUNCTION IF EXISTS public.get_dashboard_summary(uuid);
DROP FUNCTION IF EXISTS public.update_last_login(uuid);
DROP FUNCTION IF EXISTS public.get_user_profile(uuid);

-- Function to register user with key
CREATE OR REPLACE FUNCTION public.register_user_with_key(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record record;
  result json;
BEGIN
  -- Check if registration key exists and is valid
  SELECT * INTO key_record
  FROM registration_keys
  WHERE key = registration_key
    AND is_active = true
    AND uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired registration key'
    );
  END IF;
  
  -- Check if user already exists in users table
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User already registered'
    );
  END IF;
  
  -- Insert user into users table
  INSERT INTO users (
    id,
    email,
    role,
    display_name,
    school_id,
    teacher_id,
    created_at
  )
  SELECT
    user_id,
    (SELECT email FROM auth.users WHERE id = user_id),
    key_record.role,
    display_name,
    key_record.school_id,
    key_record.teacher_id,
    now();
  
  -- Update registration key usage
  UPDATE registration_keys
  SET uses = uses + 1
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
      'message', 'Registration failed: ' || SQLERRM
    );
END;
$$;

-- Function to register as student
CREATE OR REPLACE FUNCTION public.register_as_student(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function is just an alias for register_user_with_key
  RETURN public.register_user_with_key(registration_key, user_id, display_name);
END;
$$;

-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  school_record record;
  result json;
  book_stats json;
  key_stats json;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Get school info if user has school_id
  IF user_record.school_id IS NOT NULL THEN
    SELECT * INTO school_record FROM schools WHERE id = user_record.school_id;
  END IF;
  
  -- Build basic result
  result := json_build_object(
    'role', user_record.role,
    'school_id', user_record.school_id,
    'teacher_id', user_record.teacher_id,
    'school_name', COALESCE(school_record.name, 'Не назначена')
  );
  
  -- Add role-specific data
  IF user_record.role = 'super_admin' THEN
    -- Super admin statistics
    SELECT json_build_object(
      'school_keys', COUNT(*) FILTER (WHERE role = 'school'),
      'teacher_keys', COUNT(*) FILTER (WHERE role = 'teacher'),
      'student_keys', COUNT(*) FILTER (WHERE role = 'student'),
      'author_keys', COUNT(*) FILTER (WHERE role = 'author'),
      'moderator_keys', COUNT(*) FILTER (WHERE role = 'moderator'),
      'unassigned_student_keys', COUNT(*) FILTER (WHERE role = 'student' AND school_id IS NULL),
      'assigned_keys', COUNT(*) FILTER (WHERE uses > 0)
    ) INTO key_stats
    FROM registration_keys WHERE is_active = true;
    
    result := result || json_build_object(
      'user_count', (SELECT COUNT(*) FROM users),
      'school_count', (SELECT COUNT(*) FROM schools),
      'teacher_count', (SELECT COUNT(*) FROM users WHERE role = 'teacher'),
      'student_count', (SELECT COUNT(*) FROM users WHERE role = 'student'),
      'key_stats', key_stats
    );
    
  ELSIF user_record.role = 'school' THEN
    -- School admin statistics
    SELECT json_build_object(
      'teacher_keys', COUNT(*) FILTER (WHERE role = 'teacher'),
      'student_keys', COUNT(*) FILTER (WHERE role = 'student')
    ) INTO key_stats
    FROM registration_keys 
    WHERE is_active = true AND school_id = user_record.school_id;
    
    SELECT json_build_object(
      'total_books', COUNT(*)
    ) INTO book_stats
    FROM books 
    WHERE school_id = user_record.school_id;
    
    result := result || json_build_object(
      'teacher_count', (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND school_id = user_record.school_id),
      'student_count', (SELECT COUNT(*) FROM users WHERE role = 'student' AND school_id = user_record.school_id),
      'key_stats', key_stats,
      'book_stats', book_stats
    );
    
  ELSIF user_record.role = 'teacher' THEN
    -- Teacher statistics
    SELECT json_build_object(
      'student_keys', COUNT(*)
    ) INTO key_stats
    FROM registration_keys 
    WHERE is_active = true AND teacher_id = user_record.id;
    
    SELECT json_build_object(
      'total_books', COUNT(*)
    ) INTO book_stats
    FROM books 
    WHERE school_id = user_record.school_id;
    
    result := result || json_build_object(
      'student_count', (SELECT COUNT(*) FROM users WHERE teacher_id = user_record.id),
      'key_stats', key_stats,
      'book_stats', book_stats
    );
    
  ELSIF user_record.role = 'student' THEN
    -- Student statistics
    SELECT json_build_object(
      'total_books', COUNT(*)
    ) INTO book_stats
    FROM books 
    WHERE school_id = user_record.school_id AND status = 'Active';
    
    result := result || json_build_object(
      'book_stats', book_stats
    );
    
  ELSIF user_record.role = 'author' THEN
    -- Author statistics
    SELECT json_build_object(
      'total_books', COUNT(*),
      'draft_books', COUNT(*) FILTER (WHERE status = 'Draft'),
      'moderation_books', COUNT(*) FILTER (WHERE status = 'Moderation'),
      'active_books', COUNT(*) FILTER (WHERE status = 'Active'),
      'approved_books', COUNT(*) FILTER (WHERE status = 'Approved')
    ) INTO book_stats
    FROM books 
    WHERE author_id = user_record.id;
    
    result := result || json_build_object(
      'book_stats', book_stats
    );
    
  ELSIF user_record.role = 'moderator' THEN
    -- Moderator statistics
    SELECT json_build_object(
      'moderation_books', COUNT(*) FILTER (WHERE status = 'Moderation'),
      'approved_books', COUNT(*) FILTER (WHERE status = 'Approved'),
      'total_assigned', COUNT(*),
      'weekly_reviews', COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days')
    ) INTO book_stats
    FROM books;
    
    result := result || json_build_object(
      'book_stats', book_stats
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET last_login = now()
  WHERE id = user_id;
END;
$$;

-- Function to get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  RETURN json_build_object(
    'id', user_record.id,
    'email', user_record.email,
    'role', user_record.role,
    'display_name', user_record.display_name,
    'school_id', user_record.school_id,
    'teacher_id', user_record.teacher_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.register_user_with_key(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_as_student(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_login(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO authenticated; 