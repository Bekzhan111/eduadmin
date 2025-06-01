const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function forceFix() {
  try {
    console.log('Force fixing register_with_key function...');
    
    // First, let's try to call the existing function to see what happens
    console.log('Testing current function...');
    const { data: testData, error: testError } = await supabase.rpc('register_with_key', {
      registration_key: 'test',
      user_id: '00000000-0000-0000-0000-000000000000',
      display_name: 'test'
    });
    
    console.log('Test result:', { testData, testError });
    
    // Now let's try to create a new function with a different name first
    console.log('Creating temporary function...');
    
    const tempFunctionSQL = `
CREATE OR REPLACE FUNCTION public.register_with_key_new(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record RECORD;
  user_record RECORD;
BEGIN
  -- Check if the registration key exists and is valid
  SELECT * INTO key_record
  FROM registration_keys
  WHERE key = registration_key
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND uses < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired registration key'
    );
  END IF;

  -- Check if user already exists
  SELECT * INTO user_record
  FROM users
  WHERE id = user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already registered'
    );
  END IF;

  -- Insert the new user
  INSERT INTO users (
    id,
    email,
    display_name,
    role,
    school_id,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    (SELECT email FROM auth.users WHERE id = user_id),
    display_name,
    key_record.role,
    CASE 
      WHEN key_record.role IN ('teacher', 'student') THEN key_record.school_id
      ELSE NULL
    END,
    NOW(),
    NOW()
  );

  -- Update the registration key usage
  UPDATE registration_keys
  SET uses = uses + 1,
      updated_at = NOW()
  WHERE key = registration_key;

  RETURN json_build_object(
    'success', true,
    'user_id', user_id,
    'role', key_record.role,
    'school_id', key_record.school_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;`;

    // Try to execute this via direct query
    const { error: createError } = await supabase.rpc('exec', { sql: tempFunctionSQL });
    
    if (createError) {
      console.error('Error creating temp function:', createError);
    } else {
      console.log('✓ Temporary function created');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

forceFix(); 