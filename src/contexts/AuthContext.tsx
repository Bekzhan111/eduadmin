'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase';
import { User, Session } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  userProfile: {
    id: string;
    role: string;
    email: string;
    display_name: string | null;
    school_id: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
};

type AuthContextType = AuthState & {
  refreshAuth: () => Promise<void>;
  clearAuth: () => void;
  clearError: () => void;
  logout: () => Promise<void>;
  clearProfileCache: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userProfile: null,
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  
  // Add cache for user profile to avoid unnecessary database calls
  const profileCacheRef = useRef<{
    userId: string;
    profile: any;
    timestamp: number;
  } | null>(null);
  
  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearAuth = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Clear profile cache when logging out
    profileCacheRef.current = null;
    
    setAuthState({
      user: null,
      session: null,
      userProfile: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    });
  }, []);

  const clearError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the auth state
      clearAuth();
    }
  }, [clearAuth]);

  const clearProfileCache = useCallback(() => {
    profileCacheRef.current = null;
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isMountedRef.current || isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    try {
      const supabase = createClient();
      
      // First, check if we can reach Supabase
      let sessionData;
      try {
        const result = await supabase.auth.getSession();
        sessionData = result.data;
        
        if (result.error) {
          if (isMountedRef.current) {
            setAuthState(prev => ({
              ...prev,
              error: result.error.message,
              isLoading: false,
              isInitialized: true,
            }));
          }
          isRefreshingRef.current = false;
          return;
        }
      } catch (networkError) {
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            isLoading: false,
            error: (networkError instanceof Error && networkError.message.includes('Load failed')) ? 
              'Ошибка подключения. Проверьте интернет-соединение и перезагрузите страницу.' : 
              (networkError instanceof Error ? networkError.message : String(networkError)),
            isInitialized: true,
          });
        }
        isRefreshingRef.current = false;
        return;
      }

      if (!sessionData?.session) {
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            isLoading: false,
            error: null,
            isInitialized: true,
          });
        }
        isRefreshingRef.current = false;
        return;
      }

      const userId = sessionData.session.user.id;
      
      // Check if we have a valid cached profile
      const cachedProfile = profileCacheRef.current;
      if (cachedProfile && 
          cachedProfile.userId === userId && 
          (Date.now() - cachedProfile.timestamp) < CACHE_EXPIRATION) {
        
        // Use cached profile data
        if (isMountedRef.current) {
          setAuthState({
            user: sessionData.session.user,
            session: sessionData.session,
            userProfile: {
              id: userId,
              role: cachedProfile.profile.role || 'unknown',
              email: cachedProfile.profile.email || sessionData.session.user.email || '',
              display_name: cachedProfile.profile.display_name || null,
              school_id: cachedProfile.profile.school_id || null,
            },
            isLoading: false,
            error: null,
            isInitialized: true,
          });
        }
        isRefreshingRef.current = false;
        return;
      }

      // Get user profile data if not cached
      let userData;
      try {
        const result = await supabase
          .from('users')
          .select('role, email, display_name, school_id')
          .eq('id', userId)
          .maybeSingle();

        if (result.error) {
          if (isMountedRef.current) {
            setAuthState(prev => ({
              ...prev,
              error: `Error fetching user profile: ${result.error.message}`,
              isLoading: false,
              isInitialized: true,
            }));
          }
          isRefreshingRef.current = false;
          return;
        }
        
        userData = result.data;
      } catch (networkError) {
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: (networkError instanceof Error && networkError.message.includes('Load failed')) ? 
              'Ошибка загрузки профиля. Проверьте подключение и обновите страницу.' : 
              `Network error: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
            isLoading: false,
            isInitialized: true,
          }));
        }
        isRefreshingRef.current = false;
        return;
      }

      // If user not found in users table
      if (!userData) {
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: 'Профиль пользователя не найден. Обратитесь к администратору.',
            isLoading: false,
            isInitialized: true,
          }));
        }
        isRefreshingRef.current = false;
        return;
      }

      // Cache the profile data
      profileCacheRef.current = {
        userId,
        profile: userData,
        timestamp: Date.now()
      };

      const userProfile = {
        id: userId,
        role: userData.role || 'unknown',
        email: userData.email || sessionData.session.user.email || '',
        display_name: userData.display_name || null,
        school_id: userData.school_id || null,
      };

      if (isMountedRef.current) {
        setAuthState({
          user: sessionData.session.user,
          session: sessionData.session,
          userProfile,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      }

    } catch (error) {
      if (isMountedRef.current) {
        // For unexpected errors, check if it looks like a network issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNetworkError = errorMessage.includes('Load failed') || 
                              errorMessage.includes('fetch') || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('NetworkError');
        
        if (isNetworkError) {
          // For network errors, clear auth state gracefully with better message
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            isLoading: false,
            error: 'Проблема с подключением. Проверьте интернет и обновите страницу.',
            isInitialized: true,
          });
        } else {
          // For other errors
          setAuthState(prev => ({
            ...prev,
            error: `Unexpected error: ${errorMessage}`,
            isLoading: false,
            isInitialized: true,
          }));
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Инициализация при монтировании компонента
  useEffect(() => {
    // Устанавливаем таймаут для принудительной инициализации, если что-то пошло не так
    const timeoutId = setTimeout(() => {
      if (!authState.isInitialized) {
        console.warn('Auth initialization timeout reached. Forcing initialization.');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
        }));
      }
    }, 5000); // 5 секунд таймаут
    
    refreshAuth();
    
    // Устанавливаем обработчик события для отслеживания изменений сессии
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });

    // Listen for profile updates to clear cache
    const handleProfileUpdate = () => {
      clearProfileCache();
      refreshAuth();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [refreshAuth, clearProfileCache]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        refreshAuth,
        clearAuth,
        clearError,
        logout,
        clearProfileCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
