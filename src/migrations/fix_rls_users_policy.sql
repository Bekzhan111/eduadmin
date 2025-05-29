-- Drop any existing policies on the users table
DROP POLICY IF EXISTS "Users can see their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Super admin can see all users" ON users;
DROP POLICY IF EXISTS "Super admin can update any user" ON users;
DROP POLICY IF EXISTS "School admin can see school users" ON users;
DROP POLICY IF EXISTS "School can see school users" ON users;
DROP POLICY IF EXISTS "School admin can update school users" ON users;

-- Create a secure function to get user role without triggering RLS
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

-- Create policies that don't cause recursion
-- 1. Users can see their own data
CREATE POLICY "Users can see own data" ON users
FOR SELECT USING (
  auth.uid() = id
);

-- 2. Super admins can see all users
CREATE POLICY "Super admins can see all users" ON users
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'super_admin'
);

-- 3. School admins can see users from their school
CREATE POLICY "School admins can see school users" ON users
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'school' AND
  (SELECT school_id FROM users WHERE id = auth.uid()) = school_id
);

-- 4. Users can update their own data
CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (
  auth.uid() = id
);

-- 5. Super admins can update any user
CREATE POLICY "Super admins can update any user" ON users
FOR UPDATE USING (
  public.get_user_role(auth.uid()) = 'super_admin'
);

-- 6. School admins can update users from their school
CREATE POLICY "School admins can update school users" ON users
FOR UPDATE USING (
  public.get_user_role(auth.uid()) = 'school' AND
  (SELECT school_id FROM users WHERE id = auth.uid()) = school_id
); 