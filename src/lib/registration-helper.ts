import { createClient } from '@supabase/supabase-js';

// These environment variables should be available on the server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export interface RegistrationResult {
  success: boolean;
  message: string;
  role?: string;
}

export async function registerUserWithKey(
  registrationKey: string,
  userId: string,
  displayName: string
): Promise<RegistrationResult> {
  try {
    console.log('🔄 Starting registration process...');
    console.log('📋 Parameters:', { registrationKey, userId, displayName });

    // Check if registration key exists and is valid
    const { data: keyData, error: keyError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('key', registrationKey)
      .eq('is_active', true)
      .single();

    console.log('🔑 Key lookup result:', { keyData, keyError });

    if (keyError || !keyData) {
      return {
        success: false,
        message: 'Invalid or expired registration key'
      };
    }

    // Check if key has uses left
    if (keyData.uses >= keyData.max_uses) {
      return {
        success: false,
        message: 'Registration key has been used up'
      };
    }

    // Check if user already exists in users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('👤 User check result:', { existingUser, userCheckError });

    // Get user email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    console.log('🔐 Auth user lookup:', { authUser: authUser?.user?.email, authError });

    if (authError || !authUser.user) {
      return {
        success: false,
        message: 'User not found in authentication system'
      };
    }

    let userOperation = 'insert';

    if (existingUser) {
      // Check if user is already properly registered (has email and display_name)
      if (existingUser.email && existingUser.display_name) {
        return {
          success: false,
          message: 'User already registered'
        };
      }
      
      // User exists but is incomplete, update them
      userOperation = 'update';
      console.log('🔄 Updating incomplete user record...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: authUser.user.email,
          role: keyData.role,
          display_name: displayName,
          school_id: keyData.school_id,
          teacher_id: keyData.teacher_id
        })
        .eq('id', userId);

      console.log('📝 User update result:', { updateError });

      if (updateError) {
        console.error('Update error:', updateError);
        return {
          success: false,
          message: `Registration failed: ${updateError.message}`
        };
      }
    } else {
      // Insert new user into users table
      console.log('➕ Creating new user record...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email,
          role: keyData.role,
          display_name: displayName,
          school_id: keyData.school_id,
          teacher_id: keyData.teacher_id,
          created_at: new Date().toISOString()
        });

      console.log('📝 User insert result:', { insertError });

      if (insertError) {
        console.error('Insert error:', insertError);
        return {
          success: false,
          message: `Registration failed: ${insertError.message}`
        };
      }
    }

    // Update registration key usage
    const { error: updateError } = await supabase
      .from('registration_keys')
      .update({ uses: keyData.uses + 1 })
      .eq('key', registrationKey);

    console.log('🔄 Key update result:', { updateError });

    if (updateError) {
      console.error('Update key error:', updateError);
      // Don't fail the registration if key update fails
    }

    console.log(`✅ Registration completed successfully (${userOperation})`);

    return {
      success: true,
      message: 'User registered successfully',
      role: keyData.role
    };

  } catch (error) {
    console.error('❌ Unexpected error in registration:', error);
    return {
      success: false,
      message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 