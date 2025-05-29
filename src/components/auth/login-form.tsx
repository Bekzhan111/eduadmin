'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordStrengthRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Successfully logged in, redirect to dashboard
      router.push('/dashboard');
      router.refresh();
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
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setSuccess(
        'Registration successful! Please check your email to confirm your account.'
      );
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
            <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1">
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