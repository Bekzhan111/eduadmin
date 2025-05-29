import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';
import { redirectIfAuthenticated } from '@/utils/auth-helpers';
import { ThemeToggle } from '@/components/theme-toggle';

// Mark this page as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Login - Admin Panel',
  description: 'Login to the admin panel',
};

export default async function LoginPage() {
  await redirectIfAuthenticated();
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>
          
          <div className="mt-6">
            <Suspense fallback={
              <div className="bg-card text-card-foreground p-8 rounded-lg shadow-md w-full max-w-md border">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 