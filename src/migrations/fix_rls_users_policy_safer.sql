-- First create the helper function that will avoid recursion
-- This function runs with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Get existing policy names for the users table
DO $$
DECLARE
  policy_exists boolean;
  policy_record record;
  timestamp_suffix text;
BEGIN
  -- First, let's check and drop ALL possible policy variations to be thorough
  
  -- Drop all possible select policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'users' AND cmd = 'SELECT'
  LOOP
    EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON users';
  END LOOP;
  
  -- Drop all possible update policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'users' AND cmd = 'UPDATE'
  LOOP
    EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON users';
  END LOOP;
  
  -- Now create the new policies with timestamp suffix to ensure uniqueness
  timestamp_suffix := to_char(now(), 'YYYYMMDD_HH24MISS');
  
  -- 1. Create select policy for users to see own data
  EXECUTE 'CREATE POLICY "RLS_users_see_own_' || timestamp_suffix || '" ON users
  FOR SELECT USING (
    auth.uid() = id
  )';
  
  -- 2. Create select policy for super admins to see all users
  EXECUTE 'CREATE POLICY "RLS_super_admin_see_all_' || timestamp_suffix || '" ON users
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = ''super_admin''
  )';
  
  -- 3. Create select policy for school admins to see their school's users
  EXECUTE 'CREATE POLICY "RLS_school_see_school_users_' || timestamp_suffix || '" ON users
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = ''school'' AND
    (SELECT school_id FROM users WHERE id = auth.uid()) = school_id
  )';
  
  -- 4. Create update policy for users to update own data
  EXECUTE 'CREATE POLICY "RLS_users_update_own_' || timestamp_suffix || '" ON users
  FOR UPDATE USING (
    auth.uid() = id
  )';
  
  -- 5. Create update policy for super admins to update any user
  EXECUTE 'CREATE POLICY "RLS_super_admin_update_any_' || timestamp_suffix || '" ON users
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = ''super_admin''
  )';
  
  -- 6. Create update policy for school admins to update their school's users
  EXECUTE 'CREATE POLICY "RLS_school_update_school_users_' || timestamp_suffix || '" ON users
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = ''school'' AND
    (SELECT school_id FROM users WHERE id = auth.uid()) = school_id
  )';
END
$$; 