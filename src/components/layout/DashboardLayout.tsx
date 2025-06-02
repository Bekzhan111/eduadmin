'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import AppBar from '@/components/layout/AppBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading, error, refreshAuth, clearError } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an auth error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4 text-lg font-semibold">Ошибка Аутентификации</div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Если проблема повторяется, попробуйте очистить кэш браузера или обратитесь к администратору
          </p>
        </div>
      </div>
    );
  }

  // If no session after loading is complete, show login prompt instead of redirect
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700 dark:text-gray-300 mb-4">Пожалуйста, войдите в систему для продолжения</div>
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <AppBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 