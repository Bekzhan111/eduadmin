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
};

type AuthContextType = AuthState & {
  refreshAuth: () => Promise<void>;
  clearAuth: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userProfile: null,
    isLoading: true,
    error: null,
  });

  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearAuth = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('🧹 AuthContext: Clearing auth state');
    setAuthState({
      user: null,
      session: null,
      userProfile: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('🧹 AuthContext: Clearing error state');
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isMountedRef.current || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    console.log('🔄 AuthContext: Starting auth refresh');

    try {
      const supabase = createClient();
      
      // First, check if we can reach Supabase
      let sessionData;
      try {
        console.log('🔍 AuthContext: Getting session...');
        const result = await supabase.auth.getSession();
        sessionData = result.data;
        
        if (result.error) {
          console.error('❌ AuthContext: Session error:', result.error.message);
          if (isMountedRef.current) {
            setAuthState(prev => ({
              ...prev,
              error: result.error.message,
              isLoading: false,
            }));
          }
          return;
        }
        console.log('✅ AuthContext: Session retrieved successfully');
      } catch (networkError) {
        console.error('❌ AuthContext: Network error getting session:', networkError);
        console.error('❌ AuthContext: Error details:', {
          name: networkError instanceof Error ? networkError.name : 'Unknown',
          message: networkError instanceof Error ? networkError.message : String(networkError),
          stack: networkError instanceof Error ? networkError.stack : 'No stack'
        });
        
        // If it's a network error during logout, just clear auth without showing error
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            isLoading: false,
            error: (networkError instanceof Error && networkError.message.includes('Load failed')) ? 
              'Ошибка подключения. Проверьте интернет-соединение и перезагрузите страницу.' : 
              (networkError instanceof Error ? networkError.message : String(networkError)),
          });
        }
        return;
      }

      if (!sessionData?.session) {
        console.log('ℹ️ AuthContext: No session found - user not logged in');
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            session: null,
            userProfile: null,
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      console.log('✅ AuthContext: Session found for user:', sessionData.session.user.email, 'ID:', sessionData.session.user.id);

      // Get user profile data with retry logic
      let userData;
      try {
        console.log('👤 AuthContext: Fetching user profile...');
        const result = await supabase
          .from('users')
          .select('role, email, display_name, school_id')
          .eq('id', sessionData.session.user.id)
          .maybeSingle();

        if (result.error) {
          console.error('❌ AuthContext: Error fetching user profile:', result.error.message);
          console.error('❌ AuthContext: Error details:', result.error);
          if (isMountedRef.current) {
            setAuthState(prev => ({
              ...prev,
              error: `Error fetching user profile: ${result.error.message}`,
              isLoading: false,
            }));
          }
          return;
        }
        
        userData = result.data;
        console.log('✅ AuthContext: User profile fetched successfully:', userData);
      } catch (networkError) {
        console.error('❌ AuthContext: Network error fetching user profile:', networkError);
        console.error('❌ AuthContext: Error details:', {
          name: networkError instanceof Error ? networkError.name : 'Unknown',
          message: networkError instanceof Error ? networkError.message : String(networkError),
          stack: networkError instanceof Error ? networkError.stack : 'No stack'
        });
        
        // For network errors, show better error message
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: (networkError instanceof Error && networkError.message.includes('Load failed')) ? 
              'Ошибка загрузки профиля. Проверьте подключение и обновите страницу.' : 
              `Network error: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
            isLoading: false,
          }));
        }
        return;
      }

      // Если пользователь не найден в таблице users, но есть в auth
      if (!userData) {
        console.error('❌ AuthContext: User exists in auth but not in users table:', sessionData.session.user.id);
        console.error('❌ AuthContext: This will cause "User profile not found" error');
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: 'Профиль пользователя не найден. Обратитесь к администратору.',
            isLoading: false,
          }));
        }
        return;
      }

      console.log('✅ AuthContext: User profile found:', userData);

      const userProfile = {
        id: sessionData.session.user.id,
        role: userData.role || 'unknown',
        email: userData.email || sessionData.session.user.email || '',
        display_name: userData.display_name || null,
        school_id: userData.school_id || null,
      };

      console.log('✅ AuthContext: Setting auth state with profile:', userProfile);

      if (isMountedRef.current) {
        setAuthState({
          user: sessionData.session.user,
          session: sessionData.session,
          userProfile,
          isLoading: false,
          error: null,
        });
      }

    } catch (error) {
      console.error('❌ AuthContext: Auth refresh error:', error instanceof Error ? error.message : String(error));
      console.error('❌ AuthContext: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
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
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            error: `Ошибка аутентификации: ${errorMessage}`,
            isLoading: false,
          }));
        }
      }
    } finally {
      isRefreshingRef.current = false;
      console.log('🏁 AuthContext: Auth refresh completed');
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthContext: Initializing auth provider');
    // Initial auth check
    refreshAuth();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 AuthContext: Auth event:', event, 'Session exists:', !!session);
      
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (event === 'SIGNED_IN' && session) {
        console.log('🔑 AuthContext: User signed in, refreshing auth');
        // Trigger refresh to get user profile
        await refreshAuth();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 AuthContext: Token refreshed');
        // Update session without full refresh
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
          }));
        }
      }
    });

    return () => {
      console.log('🛑 AuthContext: Cleaning up auth provider');
      subscription.unsubscribe();
    };
  }, [refreshAuth, clearAuth]);

  return (
    <AuthContext.Provider value={{ ...authState, refreshAuth, clearAuth, clearError }}>
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