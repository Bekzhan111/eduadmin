'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Access Denied</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          You don&apos;t have permission to access this page. Please log in with appropriate credentials or contact your administrator.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto"
          >
            Log In
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Need a different role? 
            <Link href="/register" className="ml-1 text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Register with a key
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 