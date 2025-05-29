'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import { LucideMenu, LucideX } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

type UserInfo = {
  role: string;
  name: string | null;
  email: string;
}

export default function AppBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
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
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, email, display_name')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user info:', userError.message);
            setIsLoading(false);
            return;
          }
          
          if (!userData) {
            console.error('No user data found');
            setIsLoading(false);
            return;
          }
          
          setUserInfo({
            role: userData.role || 'unknown',
            name: userData.display_name || null,
            email: userData.email || sessionData.session.user.email || '',
          });
        } catch (userDataError) {
          console.error('Error in user data fetch:', userDataError instanceof Error ? userDataError.message : String(userDataError));
        }
      } catch (error) {
        console.error('Error in getUserInfo:', error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserInfo();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : String(error));
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    onToggleSidebar();
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? 
              <LucideX className="h-5 w-5" /> : 
              <LucideMenu className="h-5 w-5" />
            }
          </button>
          
          <div className="hidden md:block ml-4">
            <h1 className="text-lg font-bold">Edu Platform</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {!isLoading && userInfo && (
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{userInfo.name || userInfo.email}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userInfo.role.replace('_', ' ')}</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
} 