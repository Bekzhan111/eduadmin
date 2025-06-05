'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';


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

  const translateRole = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Супер Администратор';
      case 'school': return 'Школа';
      case 'teacher': return 'Учитель';
      case 'student': return 'Студент';
      case 'author': return 'Автор';
      case 'moderator': return 'Модератор';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <span className="md:hidden font-bold text-lg">Админ Панель</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-gray-500">
            <span className="font-medium text-black">
              {userName || user.email}
            </span>
            {userRole && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {translateRole(userRole)}
              </span>
            )}
          </div>
          
          <Button 
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            size="sm"
          >
            {isLoggingOut ? 'Выход...' : 'Выйти'}
          </Button>
        </div>
      </div>
    </header>
  );
} 