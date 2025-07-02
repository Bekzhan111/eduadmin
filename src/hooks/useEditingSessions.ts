import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { EditingSession } from '@/components/book-editor/types';

interface UseEditingSessionsOptions {
  bookId: string;
  enabled?: boolean;
}

interface UseEditingSessionsReturn {
  editingSessions: EditingSession[];
  currentSession: EditingSession | null;
  isSessionLocked: (sectionId: string) => EditingSession | null;
  startEditingSession: (sectionId: string, sectionType: EditingSession['section_type']) => Promise<boolean>;
  endEditingSession: (sectionId: string) => Promise<void>;
  updateSessionActivity: (sectionId: string, cursorPosition?: any) => Promise<void>;
  forceEndSession: (sessionId: string) => Promise<void>;
}

export const useEditingSessions = ({ 
  bookId, 
  enabled = true 
}: UseEditingSessionsOptions): UseEditingSessionsReturn => {
  const { user } = useAuth();
  const [editingSessions, setEditingSessions] = useState<EditingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<EditingSession | null>(null);
  const activityRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  // Load editing sessions
  const loadEditingSessions = useCallback(async () => {
    if (!bookId || !bookId.trim() || !enabled) return;

    try {
      const { data, error } = await supabase
        .from('editing_sessions')
        .select('*')
        .eq('book_id', bookId)
        .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Sessions active in last hour

      if (error) {
        console.warn('Editing sessions table may not exist yet:', error.message);
        setEditingSessions([]);
      } else {
        setEditingSessions(data || []);
      }
    } catch (err) {
      console.warn('Failed to load editing sessions:', err);
      setEditingSessions([]);
    }
  }, [bookId, enabled, supabase]);

  // Check if a section is locked by someone else
  const isSessionLocked = useCallback((sectionId: string): EditingSession | null => {
    const activeSession = editingSessions.find(session => 
      session.section_id === sectionId && 
      session.user_id !== user?.id &&
      new Date(session.last_activity) > new Date(Date.now() - 60 * 60 * 1000) // Active in last hour
    );
    return activeSession || null;
  }, [editingSessions, user?.id]);

  // Start an editing session for a section
  const startEditingSession = useCallback(async (
    sectionId: string, 
    sectionType: EditingSession['section_type']
  ): Promise<boolean> => {
    if (!user || !bookId || !enabled) return false;

    // Check if section is already locked by someone else
    const existingLock = isSessionLocked(sectionId);
    if (existingLock) {
      console.warn('Section is already being edited by user:', existingLock.user_id);
      return false;
    }

    try {
      // Try to create or update the editing session
      const { data, error } = await supabase
        .from('editing_sessions')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          section_id: sectionId,
          section_type: sectionType,
          locked_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          cursor_position: {}
        }, {
          onConflict: 'book_id,section_id'
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error starting editing session:', error.message || error);
        return false;
      }

      setCurrentSession(data);
      
      // Start activity tracking
      if (activityRef.current) {
        clearInterval(activityRef.current);
      }
      
      activityRef.current = setInterval(() => {
        updateSessionActivity(sectionId);
      }, 30000); // Update every 30 seconds

      return true;
    } catch (err) {
      console.error('Failed to start editing session:', err);
      return false;
    }
  }, [user, bookId, enabled, isSessionLocked, supabase]);

  // End an editing session
  const endEditingSession = useCallback(async (sectionId: string) => {
    if (!user || !bookId || !enabled) return;

    try {
      const { error } = await supabase
        .from('editing_sessions')
        .delete()
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .eq('section_id', sectionId);

      if (error) {
        console.error('Error ending editing session:', error);
      } else {
        setCurrentSession(null);
        
        // Clear activity tracking
        if (activityRef.current) {
          clearInterval(activityRef.current);
          activityRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to end editing session:', err);
    }
  }, [user, bookId, enabled, supabase]);

  // Update session activity
  const updateSessionActivity = useCallback(async (sectionId: string, cursorPosition?: any) => {
    if (!user || !bookId || !enabled) return;

    try {
      const { error } = await supabase
        .from('editing_sessions')
        .update({
          last_activity: new Date().toISOString(),
          cursor_position: cursorPosition || {}
        })
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .eq('section_id', sectionId);

      if (error) {
        console.error('Error updating session activity:', error);
      }
    } catch (err) {
      console.error('Failed to update session activity:', err);
    }
  }, [user, bookId, enabled, supabase]);

  // Force end a session (for owners/editors to override locks)
  const forceEndSession = useCallback(async (sessionId: string) => {
    if (!enabled) return;

    try {
      const { error } = await supabase
        .from('editing_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error force ending session:', error);
      }
    } catch (err) {
      console.error('Failed to force end session:', err);
    }
  }, [enabled, supabase]);

  // Load sessions on mount and set up real-time updates
  useEffect(() => {
    if (!enabled || !bookId) return;

    loadEditingSessions();

    const channel = supabase
      .channel(`editing_sessions:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editing_sessions',
          filter: `book_id=eq.${bookId}`
        },
        () => {
          loadEditingSessions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enabled, bookId, loadEditingSessions, supabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityRef.current) {
        clearInterval(activityRef.current);
      }
      
      // End any active sessions when component unmounts
      if (currentSession && user && bookId) {
        endEditingSession(currentSession.section_id);
      }
    };
  }, [currentSession, user, bookId, endEditingSession]);

  // Clean up old sessions periodically
  useEffect(() => {
    if (!enabled || !bookId) return;

    const cleanup = setInterval(async () => {
      try {
        await supabase.rpc('cleanup_inactive_sessions');
      } catch (err) {
        console.error('Failed to cleanup inactive sessions:', err);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, [enabled, bookId, supabase]);

  return {
    editingSessions,
    currentSession,
    isSessionLocked,
    startEditingSession,
    endEditingSession,
    updateSessionActivity,
    forceEndSession
  };
};