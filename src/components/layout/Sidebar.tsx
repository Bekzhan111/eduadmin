'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { 
  Home, 
  Users, 
  School, 
  GraduationCap, 
  BookOpen, 
  Key, 
  Settings,
  LogOut,
  AlertCircle,
  Shield,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton';

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
};

const navigationItems: NavItem[] = [
  { name: 'Панель управления', path: '/dashboard', icon: Home, roles: ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'] },
  
  // Super Admin only
  { name: 'Пользователи', path: '/dashboard/users', icon: Users, roles: ['super_admin'] },
  { name: 'Школы', path: '/dashboard/schools', icon: School, roles: ['super_admin'] },
  { name: 'Авторы', path: '/dashboard/authors', icon: BookOpen, roles: ['super_admin'] },
  { name: 'Модераторы', path: '/dashboard/moderators', icon: Shield, roles: ['super_admin'] },
  
  // School Admin specific
  { name: 'Учителя', path: '/dashboard/teachers', icon: GraduationCap, roles: ['super_admin', 'school'] },
  { name: 'Студенты', path: '/dashboard/students', icon: Users, roles: ['super_admin', 'school', 'teacher'] },
  
  // Role-specific Books access
  { name: 'Книги', path: '/dashboard/books', icon: BookOpen, roles: ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'] },
  
  // Key Management - specific roles only
  { name: 'Управление ключами', path: '/dashboard/keys', icon: Key, roles: ['super_admin', 'school', 'teacher'] },
  
  // Settings for everyone
  { name: 'Настройки', path: '/dashboard/settings', icon: Settings, roles: ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'] },
];

export default function Sidebar({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, isLoading, error, clearAuth } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const previousPathnameRef = useRef(pathname);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    // Only close if the pathname actually changed and we're on mobile
    if (onClose && pathname !== previousPathnameRef.current && window.innerWidth < 1024) {
      onClose();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, onClose]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      
      // First, clear the auth context immediately to avoid UI issues
      clearAuth();
      
      // Then attempt to sign out from Supabase
      try {
        await supabase.auth.signOut();
        console.log('✅ Successfully signed out from Supabase');
      } catch (signOutError) {
        // If sign out fails (e.g., network error), that's OK - we've already cleared local state
        console.warn('⚠️ Failed to sign out from Supabase (but local state cleared):', signOutError);
      }
      
      // Always redirect to login regardless of Supabase sign out success
      router.push('/login');
    } catch (error) {
      console.error('Error during sign out process:', error instanceof Error ? error.message : String(error));
      // Even if there's an error, clear auth and redirect
      clearAuth();
      router.push('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    // Close sidebar on mobile after navigation
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const filteredItems = navigationItems.filter(item => 
    userProfile?.role && item.roles.includes(userProfile.role)
  );

  const translateRole = (role: string) => {
    switch (role) {
      case 'super_admin': return 'супер администратор';
      case 'school': return 'школа';
      case 'teacher': return 'учитель';
      case 'student': return 'студент';
      case 'author': return 'автор';
      case 'moderator': return 'модератор';
      default: return role.replace('_', ' ');
    }
  };

  if (error) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 fixed inset-y-0 left-0 z-50 w-64 h-full overflow-hidden`}>
          <div className="p-4 h-full flex flex-col justify-center overflow-hidden">
            {/* Close button for mobile */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            )}
            
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">Ошибка загрузки меню</span>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Повторить
            </Button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 fixed inset-y-0 left-0 z-50 w-64 h-full overflow-hidden`}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header with close button for mobile */}
          <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Меню</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-hidden">
            <div className="space-y-2 h-full overflow-hidden">
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-3">
                  <SkeletonLoader type="custom" count={6} height={44} />
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </nav>

          {/* User info and sign out */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {userProfile && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Вошли как
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userProfile.display_name || userProfile.email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {translateRole(userProfile.role)}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline" 
              size="sm"
              className="w-full flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              {isSigningOut ? 'Выход...' : 'Выйти'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
} 