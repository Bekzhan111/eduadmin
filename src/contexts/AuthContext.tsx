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
    
    setAuthState({
      user: null,
      session: null,
      userProfile: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isMountedRef.current || isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError.message);
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: sessionError.message,
            isLoading: false,
          }));
        }
        return;
      }

      if (!sessionData?.session) {
        // No session is normal - user is not logged in
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

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, display_name, school_id')
        .eq('id', sessionData.session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError.message);
        if (isMountedRef.current) {
          setAuthState(prev => ({
            ...prev,
            error: `Error fetching user profile: ${userError.message}`,
            isLoading: false,
          }));
        }
        return;
      }

      const userProfile = {
        id: sessionData.session.user.id,
        role: userData?.role || 'unknown',
        email: userData?.email || sessionData.session.user.email || '',
        display_name: userData?.display_name || null,
        school_id: userData?.school_id || null,
      };

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
      console.error('Auth refresh error:', error instanceof Error ? error.message : String(error));
      if (isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          error: 'Authentication error',
          isLoading: false,
        }));
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial auth check
    refreshAuth();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (event === 'SIGNED_IN' && session) {
        // Trigger refresh to get user profile
        await refreshAuth();
      } else if (event === 'TOKEN_REFRESHED' && session) {
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
      subscription.unsubscribe();
    };
  }, [refreshAuth, clearAuth]); // Add dependencies

  return (
    <AuthContext.Provider value={{ ...authState, refreshAuth, clearAuth }}>
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