import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserPresence } from '@/components/book-editor/types';

interface UsePresenceOptions {
  bookId: string;
  enabled?: boolean;
}

interface UsePresenceReturn {
  presence: UserPresence[];
  isOnline: boolean;
  updatePresence: (currentSection?: string, metadata?: any) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
}

export const usePresence = ({ 
  bookId, 
  enabled = true 
}: UsePresenceOptions): UsePresenceReturn => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const supabase = createClient();

  // Update presence in database
  const updatePresence = useCallback(async (currentSection?: string, metadata?: any) => {
    if (!user || !bookId || !bookId.trim() || !enabled) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          last_seen: new Date().toISOString(),
          is_online: true,
          current_section: currentSection,
          metadata: metadata || {}
        }, {
          onConflict: 'book_id,user_id'
        });

      if (error) {
        console.warn('Presence update failed (table may not exist):', error.message);
      } else {
        lastActivityRef.current = Date.now();
      }
    } catch (err) {
      console.warn('Failed to update presence:', err);
    }
  }, [user, bookId, enabled, supabase]);

  // Set online/offline status
  const setOnlineStatus = useCallback(async (online: boolean) => {
    if (!user || !bookId || !enabled) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          last_seen: new Date().toISOString(),
          is_online: online,
          metadata: {}
        }, {
          onConflict: 'book_id,user_id'
        });

      if (error) {
        console.warn('Setting online status failed (table may not exist):', error.message);
      } else {
        setIsOnline(online);
      }
    } catch (err) {
      console.warn('Failed to set online status:', err);
    }
  }, [user, bookId, enabled, supabase]);

  // Load presence data
  const loadPresence = useCallback(async () => {
    if (!bookId || !bookId.trim() || !enabled) return;

    try {
      // First try to load presence data without user join to see if table exists
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_online', true);

      if (error) {
        // If table doesn't exist or there's an error, just log it and continue
        console.warn('Presence table may not exist yet:', error.message);
        setPresence([]);
      } else {
        // Transform data to include user info placeholder
        const presenceData = (data || []).map(p => ({
          ...p,
          user: {
            id: p.user_id,
            email: `user-${p.user_id}` // Placeholder until we can properly join
          }
        }));
        setPresence(presenceData);
      }
    } catch (err) {
      console.warn('Failed to load presence:', err);
      setPresence([]);
    }
  }, [bookId, enabled, supabase]);

  // Start heartbeat to keep presence alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // If no activity for 2 minutes, mark as offline
      if (timeSinceLastActivity > 2 * 60 * 1000) {
        await setOnlineStatus(false);
        return;
      }

      // Otherwise, update presence to keep it alive
      await updatePresence();
    }, 30000); // Update every 30 seconds
  }, [updatePresence, setOnlineStatus]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Track user activity
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Initialize presence when component mounts
  useEffect(() => {
    if (!enabled || !user || !bookId) return;

    // Set initial online status
    setOnlineStatus(true);
    loadPresence();
    startHeartbeat();

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOnlineStatus(false);
        stopHeartbeat();
      } else {
        setOnlineStatus(true);
        startHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload
    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup
      setOnlineStatus(false);
      stopHeartbeat();
      
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, user, bookId, setOnlineStatus, loadPresence, startHeartbeat, stopHeartbeat, trackActivity]);

  // Set up real-time subscription for presence updates
  useEffect(() => {
    if (!bookId || !enabled) return;

    const channel = supabase
      .channel(`user_presence:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `book_id=eq.${bookId}`
        },
        () => {
          loadPresence();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [bookId, enabled, supabase, loadPresence]);

  return {
    presence,
    isOnline,
    updatePresence,
    setOnlineStatus
  };
};