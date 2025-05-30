'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Key } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Updated registration schema with full name and registration key
const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordStrengthRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  registration_key: z.string().min(4, 'Please enter a valid registration key')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  // Check for error messages from URL parameters (e.g., from auth callback)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      // Clean up the URL by removing the error parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const onLogin = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (authData.session) {
        // Successfully logged in, wait a bit for auth context to update
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Login successful but no session created. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // First check the key role and get key details
      const { data: keyData, error: keyError } = await supabase
        .from('registration_keys')
        .select('role, school_id, teacher_id')
        .eq('key', data.registration_key)
        .eq('is_active', true)
        .single();
      
      if (keyError) {
        setError('Invalid or inactive registration key');
        return;
      }
      
      // Sign up the user
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (signUpError) {
        setError(`Registration error: ${signUpError.message}`);
        return;
      }
      
      if (!userData.user) {
        setError('Registration failed');
        return;
      }
      
      if (keyData.role === 'school') {
        setError('School registration requires additional information. Please use the full registration page.');
        return;
      } else {
        // For other roles, directly register with the key and full name
        const { data: regResult, error: regError } = await supabase.rpc(
          'register_with_key',
          {
            registration_key: data.registration_key,
            user_id: userData.user.id,
            display_name: data.full_name
          }
        );
        
        if (regError) {
          console.error('Registration error:', regError);
          setError(`Registration error: ${regError.message}`);
          return;
        }
        
        if (!regResult.success) {
          setError(regResult.message);
          return;
        }
        
        setSuccess(`Registration successful! You have been registered as ${keyData.role}. Please check your email to confirm your account.`);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground p-8 rounded-lg shadow-md w-full max-w-md border">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`flex-1 py-2 ${
            activeTab === 'login'
              ? 'border-b-2 border-primary font-medium text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 ${
            activeTab === 'register'
              ? 'border-b-2 border-primary font-medium text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Login Form */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              {...registerLogin('email')}
              placeholder="your@email.com"
              className={loginErrors.email ? 'border-destructive' : ''}
            />
            {loginErrors.email && (
              <p className="mt-1 text-xs text-destructive">{loginErrors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              <Lock className="h-4 w-4 inline mr-1" />
              Password
            </label>
            <Input
              id="password"
              type="password"
              {...registerLogin('password')}
              placeholder="••••••••"
              className={loginErrors.password ? 'border-destructive' : ''}
            />
            {loginErrors.password && (
              <p className="mt-1 text-xs text-destructive">{loginErrors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </Button>
        </form>
      )}

      {/* Register Form */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
          <div>
            <label htmlFor="register-full-name" className="block text-sm font-medium text-foreground mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Full Name
            </label>
            <Input
              id="register-full-name"
              type="text"
              {...registerSignup('full_name')}
              placeholder="Enter your full name"
              className={registerErrors.full_name ? 'border-destructive' : ''}
            />
            {registerErrors.full_name && (
              <p className="mt-1 text-xs text-destructive">{registerErrors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <Input
              id="register-email"
              type="email"
              {...registerSignup('email')}
              placeholder="your@email.com"
              className={registerErrors.email ? 'border-destructive' : ''}
            />
            {registerErrors.email && (
              <p className="mt-1 text-xs text-destructive">{registerErrors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1">
              <Lock className="h-4 w-4 inline mr-1" />
              Password
            </label>
            <Input
              id="register-password"
              type="password"
              {...registerSignup('password')}
              placeholder="••••••••"
              className={registerErrors.password ? 'border-destructive' : ''}
            />
            {registerErrors.password && (
              <p className="mt-1 text-xs text-destructive">{registerErrors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
              <Lock className="h-4 w-4 inline mr-1" />
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              {...registerSignup('confirmPassword')}
              placeholder="••••••••"
              className={registerErrors.confirmPassword ? 'border-destructive' : ''}
            />
            {registerErrors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{registerErrors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="registration-key" className="block text-sm font-medium text-foreground mb-1">
              <Key className="h-4 w-4 inline mr-1" />
              Registration Key
            </label>
            <Input
              id="registration-key"
              type="text"
              {...registerSignup('registration_key')}
              placeholder="Enter your registration key"
              className={`${registerErrors.registration_key ? 'border-destructive' : ''} font-mono`}
            />
            {registerErrors.registration_key && (
              <p className="mt-1 text-xs text-destructive">{registerErrors.registration_key.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              This key determines your role in the system
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p className="font-medium mb-1">Note for school administrators:</p>
            <p>School registration requires additional information. Please use the <a href="/register" className="text-primary underline">full registration page</a> for school accounts.</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Register'}
          </Button>
        </form>
      )}
    </div>
  );
} 