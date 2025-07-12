import { createClient } from '@supabase/supabase-js';

// These environment variables should be available on the server side only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    const { data: keyCheck, error: keyError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('key', registrationKey)
      .eq('is_active', true)
      .single();

    if (keyError) {
      console.error('Key validation error:', keyError);
      return {
        success: false,
        message: 'Invalid registration key'
      };
    }

    if (!keyCheck) {
      return {
        success: false,
        message: 'Registration key not found or expired'
      };
    }

    // Check if key is not exhausted
    if (keyCheck.uses >= keyCheck.max_uses) {
      return {
        success: false,
        message: 'Registration key has been exhausted'
      };
    }

    console.log('🔑 Valid key found:', keyCheck);

    // Use the existing register_with_key function
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('register_with_key', {
        registration_key: registrationKey,
        user_id: userId,
        display_name: displayName
      });

    console.log('📝 Registration result:', { registrationResult, registrationError });

    if (registrationError) {
      console.error('Registration error:', registrationError);
      return {
        success: false,
        message: `Registration failed: ${registrationError.message}`
      };
    }

    if (!registrationResult.success) {
      return {
        success: false,
        message: registrationResult.message || 'Registration failed'
      };
    }

    console.log(`✅ Registration completed successfully with role: ${registrationResult.role}`);

    // Clear any cached profile data to ensure fresh role is loaded on next login
    if (typeof window !== 'undefined') {
      // Signal to clear cache on client side
      window.dispatchEvent(new CustomEvent('profile-updated'));
    }

    return {
      success: true,
      message: `User registered successfully as ${registrationResult.role}`,
      role: registrationResult.role
    };

  } catch (error) {
    console.error('❌ Unexpected error in registration:', error);
    return {
      success: false,
      message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 