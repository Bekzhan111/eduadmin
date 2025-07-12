-- Quick script to create an author registration key directly
-- Run this in your Supabase SQL editor to get an author key immediately

DO $$
DECLARE
  new_key TEXT;
  super_admin_id UUID;
BEGIN
  -- Get the first super admin user ID
  SELECT id INTO super_admin_id 
  FROM users 
  WHERE role = 'super_admin' 
  LIMIT 1;
  
  -- If no super admin exists, use a placeholder (you'll need to replace this)
  IF super_admin_id IS NULL THEN
    super_admin_id := '00000000-0000-0000-0000-000000000000';
  END IF;
  
  -- Generate a unique author key
  new_key := 'AUTHOR-' || ENCODE(gen_random_bytes(12), 'base64');
  new_key := REPLACE(new_key, '/', '');
  new_key := REPLACE(new_key, '+', '');
  new_key := REPLACE(new_key, '=', '');
  
  -- Insert the author registration key
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
    'author',
    NULL, -- Authors are not tied to schools
    true,
    1, -- Single use
    0,
    NOW() + INTERVAL '30 days', -- Expires in 30 days
    super_admin_id,
    NOW()
  );
  
  -- Display the new key
  RAISE NOTICE 'New author registration key created: %', new_key;
  RAISE NOTICE 'This key expires on: %', (NOW() + INTERVAL '30 days')::DATE;
  RAISE NOTICE 'Use this key at: http://your-domain.com/register';
  
END $$;