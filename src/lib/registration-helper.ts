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

    // First, validate the registration key using our strict validation function
    const { data: keyValidation, error: validationError } = await supabase
      .rpc('validate_registration_key_strict', {
        key_to_check: registrationKey
      });

    console.log('🔑 Key validation result:', { keyValidation, validationError });

    if (validationError) {
      console.error('Validation error:', validationError);
      return {
        success: false,
        message: 'Error validating registration key'
      };
    }

    if (!keyValidation.success) {
      return {
        success: false,
        message: keyValidation.error || 'Invalid registration key'
      };
    }

    // Use the new validated registration function
    const { data: registrationResult, error: registrationError } = await supabase
      .rpc('register_with_key_validated', {
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
        message: registrationResult.error || 'Registration failed'
      };
    }

    console.log(`✅ Registration completed successfully with role: ${registrationResult.role}`);

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