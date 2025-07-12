-- Diagnostic Script: Identify Registration Issues
-- Run this script to diagnose why authors are being created as students

-- 1. Check current registration keys and their roles
SELECT 
  'Current Registration Keys' as section,
  key,
  role,
  school_id,
  is_active,
  max_uses,
  uses,
  expires_at,
  created_at
FROM registration_keys
ORDER BY role, created_at DESC;

-- 2. Check recently created users and their roles
SELECT 
  'Recently Created Users' as section,
  id,
  email,
  display_name,
  role,
  school_id,
  created_at
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 3. Check for users who should be authors but are marked as students
SELECT 
  'Potential Misregistered Authors' as section,
  id,
  email,
  display_name,
  role,
  school_id,
  created_at
FROM users
WHERE role = 'student' 
  AND school_id IS NULL  -- Authors typically don't have school_id
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 4. Check for invalid or suspicious registration keys
SELECT 
  'Suspicious Registration Keys' as section,
  key,
  role,
  school_id,
  is_active,
  max_uses,
  uses,
  expires_at,
  created_at,
  CASE 
    WHEN role = 'student' AND school_id IS NULL THEN 'Student key without school'
    WHEN role = 'author' AND school_id IS NOT NULL THEN 'Author key with school'
    WHEN expires_at < NOW() THEN 'Expired key'
    WHEN uses >= max_uses THEN 'Used up key'
    WHEN NOT is_active THEN 'Inactive key'
    ELSE 'OK'
  END as issue
FROM registration_keys
WHERE 
  (role = 'student' AND school_id IS NULL) OR
  (role = 'author' AND school_id IS NOT NULL) OR
  (expires_at < NOW() AND is_active = true) OR
  (uses >= max_uses AND is_active = true)
ORDER BY created_at DESC;

-- 5. Check registration key usage statistics
SELECT 
  'Registration Key Statistics' as section,
  role,
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE is_active = true) as active_keys,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_keys,
  COUNT(*) FILTER (WHERE uses >= max_uses) as used_keys,
  COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW() AND uses < max_uses) as available_keys
FROM registration_keys
GROUP BY role
ORDER BY role;

-- 6. Check for missing database functions
SELECT 
  'Available Database Functions' as section,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%register%'
ORDER BY routine_name;

-- 7. Check for any registration keys that might have been corrupted
SELECT 
  'Potentially Corrupted Keys' as section,
  key,
  role,
  school_id,
  teacher_id,
  is_active,
  max_uses,
  uses,
  expires_at,
  created_at,
  CASE 
    WHEN key NOT LIKE role || '-%' AND key NOT LIKE '%' || UPPER(role) || '%' THEN 'Key format does not match role'
    WHEN role = 'author' AND (school_id IS NOT NULL OR teacher_id IS NOT NULL) THEN 'Author key has school/teacher association'
    WHEN role IN ('student', 'teacher') AND school_id IS NULL THEN 'Student/teacher key missing school association'
    ELSE 'OK'
  END as potential_issue
FROM registration_keys
WHERE 
  (key NOT LIKE role || '-%' AND key NOT LIKE '%' || UPPER(role) || '%') OR
  (role = 'author' AND (school_id IS NOT NULL OR teacher_id IS NOT NULL)) OR
  (role IN ('student', 'teacher') AND school_id IS NULL)
ORDER BY created_at DESC;

-- 8. Check recent authentication events (if audit table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_audit_log') THEN
    EXECUTE 'SELECT ''Recent Auth Events'' as section, * FROM auth_audit_log WHERE created_at > NOW() - INTERVAL ''7 days'' ORDER BY created_at DESC LIMIT 10';
  END IF;
END $$;

-- 9. Summary recommendation
SELECT 
  'Diagnostic Summary' as section,
  'Run the fix_registration_issue.sql script to resolve identified issues' as recommendation,
  'Check the results above for any anomalies in keys or user roles' as next_steps;