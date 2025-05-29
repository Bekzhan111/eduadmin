'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { 
  LucideHome, 
  LucideSchool, 
  LucideUsers, 
  LucideBookOpen, 
  LucideLogOut,
  LucideSettings,
  LucideBook,
  LucideGraduationCap,
  LucideUserCog
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
};

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      setIsLoading(true);
      
      try {
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError.message);
          setIsLoading(false);
          return;
        }
        
        if (!sessionData?.session) {
          // No active session is a normal state, not an error
          setIsLoading(false);
          return;
        }
        
        try {
          // Only query for the role column to avoid potential missing column issues
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user role:', userError.message);
            setIsLoading(false);
            return;
          }
          
          if (!userData) {
            console.error('No user data found');
            setIsLoading(false);
            return;
          }
          
          setUserRole(userData.role || 'unknown');
        } catch (userDataError) {
          console.error('Error in user data fetch:', userDataError instanceof Error ? userDataError.message : String(userDataError));
        }
      } catch (error) {
        console.error('Error in getUserRole:', error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserRole();
  }, []);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LucideHome className="h-5 w-5" />,
      roles: ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'],
    },
    {
      label: 'Schools',
      href: '/dashboard/schools',
      icon: <LucideSchool className="h-5 w-5" />,
      roles: ['super_admin', 'school'],
    },
    {
      label: 'Teachers',
      href: '/dashboard/teachers',
      icon: <LucideGraduationCap className="h-5 w-5" />,
      roles: ['super_admin', 'school'],
    },
    {
      label: 'Students',
      href: '/dashboard/students',
      icon: <LucideUsers className="h-5 w-5" />,
      roles: ['super_admin', 'school', 'teacher'],
    },
    {
      label: 'Moderators',
      href: '/dashboard/moderators',
      icon: <LucideUserCog className="h-5 w-5" />,
      roles: ['super_admin'],
    },
    {
      label: 'Authors',
      href: '/dashboard/authors',
      icon: <LucideBook className="h-5 w-5" />,
      roles: ['super_admin'],
    },
    {
      label: 'Content',
      href: '/dashboard/content',
      icon: <LucideBookOpen className="h-5 w-5" />,
      roles: ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'],
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: <LucideSettings className="h-5 w-5" />,
      roles: ['super_admin', 'school', 'teacher', 'author', 'moderator'],
    },
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : String(error));
    }
  };

  // Show skeleton when loading
  if (isLoading) {
    return (
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out md:relative z-10 w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4`}>
        <div className="flex items-center h-16 mb-8 md:hidden">
          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter items based on role
  const filteredNavItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out md:relative z-10 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col pt-16 md:pt-0`}>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center h-16 mb-8 md:h-auto">
          <h1 className="text-lg font-bold md:hidden">Menu</h1>
        </div>
        
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <LucideLogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
} 