'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  Key, 
  School, 
  Users, 
  UserCheck, 
  BookOpen, 
  Shield 
} from 'lucide-react';

// Registration form validation schema
const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  key: z.string().min(1, 'Registration key is required')
});

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register: registerForm1,
    handleSubmit: handleSubmitForm1,
    formState: { errors: errorsForm1 },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema)
  });
  
  const onInitialRegistration = async (data: RegistrationValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      // First check the key role and get key details
      const { data: keyData, error: keyError } = await supabase
        .from('registration_keys')
        .select('role, school_id, teacher_id')
        .eq('key', data.key)
        .eq('is_active', true)
        .single();
      
      if (keyError) {
        setError('Invalid or inactive registration key');
        setIsLoading(false);
        return;
      }
      
      // Sign up the user
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        setError(`Registration error: ${signUpError.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!userData.user) {
        setError('Registration failed');
        setIsLoading(false);
        return;
      }
      
      // For all roles, directly register with the key and full name
      const { data: regResult, error: regError } = await supabase.rpc(
        'register_with_key',
        {
          registration_key: data.key,
          user_id: userData.user.id,
          display_name: data.full_name
        }
      );
      
      if (regError) {
        console.error('Registration error:', regError);
        setError(`Registration error: ${regError.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!regResult.success) {
        setError(regResult.message);
        setIsLoading(false);
        return;
      }
      
      setSuccess(`Registration successful! You have been registered as ${keyData.role}. You can now log in.`);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your information and registration key to get started
          </p>
        </div>

        {/* Role Information Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Key className="h-5 w-5 mr-2 text-indigo-600" />
            Registration Key Types & Hierarchy
          </h3>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <School className="h-4 w-4 mr-2 text-blue-500" />
                <span><strong>School Key:</strong> Standalone registration for school administrators</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                School admins can create teacher and student keys for their institution
              </p>
            </div>
            
            <div className="border-l-2 border-gray-200 dark:border-gray-600 pl-4 ml-2">
              <div className="space-y-2">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  <span><strong>Teacher Key:</strong> Connected to a specific school</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <UserCheck className="h-4 w-4 mr-2 text-purple-500" />
                  <span><strong>Student Key:</strong> Connected to a specific school</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These keys are generated by school administrators and link users to their school
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <BookOpen className="h-4 w-4 mr-2 text-orange-500" />
                <span><strong>Author Key:</strong> Standalone registration for content creators</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Shield className="h-4 w-4 mr-2 text-red-500" />
                <span><strong>Moderator Key:</strong> Standalone registration for content moderators</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                These keys are created by super admins for platform-wide roles
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <strong>Key Hierarchy:</strong> Super Admin → School Keys → Teacher/Student Keys | Author/Moderator Keys (standalone)
          </p>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmitForm1(onInitialRegistration)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  {...registerForm1('full_name')}
                  className={`${errorsForm1.full_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                />
                {errorsForm1.full_name && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errorsForm1.full_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  {...registerForm1('email')}
                  className={`${errorsForm1.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                />
                {errorsForm1.email && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errorsForm1.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  {...registerForm1('password')}
                  className={`${errorsForm1.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                />
                {errorsForm1.password && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errorsForm1.password.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>
              
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Key className="h-4 w-4 inline mr-1" />
                  Registration Key
                </label>
                <Input
                  id="key"
                  type="text"
                  placeholder="Enter your registration key"
                  {...registerForm1('key')}
                  className={`${errorsForm1.key ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white font-mono`}
                />
                {errorsForm1.key && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errorsForm1.key.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This key determines your role in the system
                </p>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link 
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
} 