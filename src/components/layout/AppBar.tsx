'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LucideMenu, LucideX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import InvitationsBell from './InvitationsBell';

interface AppBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleMainSidebar?: () => void;
  isMainSidebarHidden?: boolean;
}

export default function AppBar({ 
  onToggleSidebar, 
  isSidebarOpen,
  onToggleMainSidebar,
  isMainSidebarHidden
}: AppBarProps) {
  const { userProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="lg:hidden">
                {isSidebarOpen ? <LucideX className="h-6 w-6" /> : <LucideMenu className="h-6 w-6" />}
              </Button>
              {onToggleMainSidebar && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleMainSidebar}
                  className="ml-2"
                >
                  {isMainSidebarHidden ? (
                    <>
                      <LucideMenu className="h-4 w-4 mr-2" />
                      Показать меню
                    </>
                  ) : (
                    <>
                      <LucideX className="h-4 w-4 mr-2" />
                      Скрыть меню
                    </>
                  )}
                </Button>
              )}
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Образовательная Платформа
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="lg:hidden">
              {isSidebarOpen ? <LucideX className="h-6 w-6" /> : <LucideMenu className="h-6 w-6" />}
            </Button>
            {onToggleMainSidebar && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleMainSidebar}
                className="ml-2"
              >
                {isMainSidebarHidden ? (
                  <>
                    <LucideMenu className="h-4 w-4 mr-2" />
                    Показать меню
                  </>
                ) : (
                  <>
                    <LucideX className="h-4 w-4 mr-2" />
                    Скрыть меню
                  </>
                )}
              </Button>
            )}
            <h1 className="ml-2 text-xl font-semibold text-gray-900">
              Образовательная Платформа
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <InvitationsBell />
            {userProfile && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {userProfile.display_name || userProfile.email}
                </span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userProfile.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 