'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardHeaderProps {
  user: User;
  userRole?: string;
  userName?: string;
}

export default function DashboardHeader({ user, userRole, userName }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-white dark:bg-slate-950">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <span className="md:hidden font-bold text-lg">Admin Panel</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-black dark:text-white">
              {userName || user.email}
            </span>
            {userRole && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
          </div>
          
          <Button 
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            size="sm"
          >
            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </header>
  );
} 