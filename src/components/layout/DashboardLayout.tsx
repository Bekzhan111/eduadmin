'use client';

import React, { useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import AppBar from '@/components/layout/AppBar';

function DashboardLayoutComponent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isLoading, error, refreshAuth, clearError } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarHidden, setMainSidebarHidden] = useState(false);
  
  // Use memoized values to prevent unnecessary re-renders
  const isBookEditorPage = useMemo(() => {
    return pathname?.includes('/books/') && pathname?.includes('/edit');
  }, [pathname]);
  
  const shouldHideSidebar = useMemo(() => {
    return searchParams?.get('hideSidebar') === 'true';
  }, [searchParams]);

  useEffect(() => {
    // Set main sidebar hidden state based on URL parameter
    setMainSidebarHidden(shouldHideSidebar);
    
    // Auto-hide sidebar in book editor if requested
    if (isBookEditorPage && shouldHideSidebar) {
      setSidebarOpen(false);
    }
  }, [isBookEditorPage, shouldHideSidebar]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleMainSidebar = useCallback(() => {
    setMainSidebarHidden(prev => {
      const newHiddenState = !prev;
      
      // Update URL parameters
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      if (newHiddenState) {
        newSearchParams.set('hideSidebar', 'true');
      } else {
        newSearchParams.delete('hideSidebar');
      }
      
      // Use router.replace to update URL without page reload
      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.replace(newUrl);
      
      return newHiddenState;
    });
  }, [pathname, router, searchParams]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleRetry = useCallback(async () => {
    if (refreshAuth) {
      await refreshAuth();
    } else {
      // Fallback: refresh the page
      window.location.reload();
    }
  }, [refreshAuth]);

  const handleClearError = useCallback(() => {
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an auth error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4 text-lg font-semibold">Ошибка Аутентификации</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Обновить
            </button>
            <button 
              onClick={handleClearError}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Очистить Ошибку
            </button>
            <button 
              onClick={() => router.push('/debug')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Диагностика
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Перейти к Входу
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Если проблема повторяется, попробуйте очистить кэш браузера или обратитесь к администратору
          </p>
        </div>
      </div>
    );
  }

  // If no session after loading is complete, show login prompt instead of redirect
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700 mb-4">Пожалуйста, войдите в систему для продолжения</div>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Перейти к Входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <AppBar 
        onToggleSidebar={toggleSidebar} 
        isSidebarOpen={sidebarOpen}
        onToggleMainSidebar={isBookEditorPage ? toggleMainSidebar : undefined}
        isMainSidebarHidden={mainSidebarHidden}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {!mainSidebarHidden && (
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        )}
        
        <main className="flex-1 overflow-y-auto">
          {isBookEditorPage ? (
            <div className="pt-4">
              {children}
            </div>
          ) : (
            <div className="container mx-auto p-4">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders of the dashboard layout
const MemoizedDashboardLayoutComponent = React.memo(DashboardLayoutComponent);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка панели...</p>
        </div>
      </div>
    }>
      <MemoizedDashboardLayoutComponent>{children}</MemoizedDashboardLayoutComponent>
    </Suspense>
  );
} 
