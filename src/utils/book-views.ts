'use client';

import { createClient } from '@/utils/supabase';

// Generate a unique session ID for anonymous users
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('book_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('book_session_id', sessionId);
  }
  return sessionId;
}

// Track a book view
export async function trackBookView(bookId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get session ID for anonymous tracking
    const sessionId = getSessionId();
    
    // Get user agent and IP (IP will be handled by Supabase)
    const userAgent = navigator.userAgent;
    
    // Check if this user/session already viewed this book recently (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentView } = await supabase
      .from('book_views')
      .select('id')
      .eq('book_id', bookId)
      .eq(user ? 'user_id' : 'session_id', user ? user.id : sessionId)
      .gte('viewed_at', twentyFourHoursAgo)
      .limit(1);
    
    // Don't track if already viewed recently
    if (recentView && recentView.length > 0) {
      return false;
    }
    
    // Record the view
    const { error } = await supabase
      .from('book_views')
      .insert({
        book_id: bookId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        user_agent: userAgent,
      });
    
    if (error) {
      console.error('Error tracking book view:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking book view:', error);
    return false;
  }
}

// Get book view statistics
export async function getBookViewStats(bookId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('get_book_stats', { book_uuid: bookId });
    
    if (error) {
      console.error('Error getting book stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting book stats:', error);
    return null;
  }
}

// Get recent viewers for a book (for authors/admins)
export async function getRecentViewers(bookId: string, limit: number = 10) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('book_views')
      .select(`
        id,
        viewed_at,
        user_id,
        users:user_id (display_name, email)
      `)
      .eq('book_id', bookId)
      .not('user_id', 'is', null)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting recent viewers:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error getting recent viewers:', error);
    return [];
  }
}

// Check if current user has viewed a book
export async function hasUserViewedBook(bookId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Check by session ID for anonymous users
      const sessionId = getSessionId();
      const { data } = await supabase
        .from('book_views')
        .select('id')
        .eq('book_id', bookId)
        .eq('session_id', sessionId)
        .limit(1);
      
      return Boolean(data && data.length > 0);
    }
    
    // Check by user ID for authenticated users
    const { data } = await supabase
      .from('book_views')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .limit(1);
    
    return Boolean(data && data.length > 0);
  } catch (error) {
    console.error('Error checking if user viewed book:', error);
    return false;
  }
} 