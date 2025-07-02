/**
 * Supabase collaboration database functions
 * Database query functions for collaboration features
 */

import { createClient } from '@/utils/supabase';
import { 
  BookCollaborator, 
  CollaborationInvitation, 
  EditingSession, 
  UserPresence, 
  BookComment,
  CollaboratorRole 
} from '@/components/book-editor/types';

const supabase = createClient();

/**
 * COLLABORATORS
 */

export async function getBookCollaborators(bookId: string): Promise<BookCollaborator[]> {
  const { data, error } = await supabase
    .from('book_collaborators')
    .select(`
      *,
      user:users(id, email, display_name, role)
    `)
    .eq('book_id', bookId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching collaborators:', error);
    throw new Error('Failed to fetch collaborators');
  }

  return data || [];
}

export async function addCollaborator(
  bookId: string, 
  userId: string, 
  role: CollaboratorRole,
  invitedBy: string
): Promise<BookCollaborator> {
  const { data, error } = await supabase
    .from('book_collaborators')
    .insert([{
      book_id: bookId,
      user_id: userId,
      role,
      invited_by: invitedBy
    }])
    .select(`
      *,
      user:users(id, email, display_name, role)
    `)
    .single();

  if (error) {
    console.error('Error adding collaborator:', error);
    throw new Error('Failed to add collaborator');
  }

  return data;
}

export async function updateCollaboratorRole(
  collaboratorId: string, 
  newRole: CollaboratorRole
): Promise<BookCollaborator> {
  const { data, error } = await supabase
    .from('book_collaborators')
    .update({ role: newRole })
    .eq('id', collaboratorId)
    .select(`
      *,
      user:users(id, email, display_name, role)
    `)
    .single();

  if (error) {
    console.error('Error updating collaborator role:', error);
    throw new Error('Failed to update collaborator role');
  }

  return data;
}

export async function removeCollaborator(collaboratorId: string): Promise<void> {
  const { error } = await supabase
    .from('book_collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) {
    console.error('Error removing collaborator:', error);
    throw new Error('Failed to remove collaborator');
  }
}

export async function getUserCollaboratorRole(
  bookId: string, 
  userId: string
): Promise<BookCollaborator | null> {
  const { data, error } = await supabase
    .from('book_collaborators')
    .select(`
      *,
      user:users(id, email, display_name, role)
    `)
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned, user is not a collaborator
      return null;
    }
    console.error('Error fetching user collaborator role:', error);
    throw new Error('Failed to fetch user collaborator role');
  }

  return data;
}

/**
 * INVITATIONS
 */

export async function createInvitation(
  bookId: string,
  inviterId: string,
  inviteeEmail: string,
  role: CollaboratorRole,
  message?: string
): Promise<CollaborationInvitation> {
  // First check if user exists
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', inviteeEmail)
    .single();

  const { data, error } = await supabase
    .from('collaboration_invitations')
    .insert([{
      book_id: bookId,
      inviter_id: inviterId,
      invitee_email: inviteeEmail,
      invitee_id: user?.id,
      role,
      message
    }])
    .select(`
      *,
      inviter:users!inviter_id(id, email, display_name),
      book:books(id, title, base_url)
    `)
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    throw new Error('Failed to create invitation');
  }

  return data;
}

export async function getUserInvitations(userId: string): Promise<CollaborationInvitation[]> {
  const { data: user } = await supabase.auth.getUser();
  const userEmail = user.user?.email;

  const { data, error } = await supabase
    .from('collaboration_invitations')
    .select(`
      *,
      inviter:users!inviter_id(id, email, display_name),
      book:books(id, title, base_url)
    `)
    .or(`invitee_id.eq.${userId},invitee_email.eq.${userEmail}`)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user invitations:', error);
    throw new Error('Failed to fetch invitations');
  }

  return data || [];
}

export async function getBookInvitations(bookId: string): Promise<CollaborationInvitation[]> {
  const { data, error } = await supabase
    .from('collaboration_invitations')
    .select(`
      *,
      inviter:users!inviter_id(id, email, display_name)
    `)
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching book invitations:', error);
    throw new Error('Failed to fetch book invitations');
  }

  return data || [];
}

export async function respondToInvitation(
  invitationId: string, 
  response: 'accepted' | 'rejected'
): Promise<void> {
  if (response === 'accepted') {
    // Use the database function to accept invitation
    const { error } = await supabase.rpc('accept_collaboration_invitation', {
      invitation_id: invitationId
    });

    if (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }
  } else {
    // Use the database function to reject invitation
    const { error } = await supabase.rpc('reject_collaboration_invitation', {
      invitation_id: invitationId
    });

    if (error) {
      console.error('Error rejecting invitation:', error);
      throw new Error('Failed to reject invitation');
    }
  }
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('collaboration_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('Error canceling invitation:', error);
    throw new Error('Failed to cancel invitation');
  }
}

/**
 * EDITING SESSIONS
 */

export async function startEditingSession(
  bookId: string,
  userId: string,
  sectionId: string,
  sectionType: EditingSession['section_type']
): Promise<EditingSession> {
  const { data, error } = await supabase
    .from('editing_sessions')
    .upsert([{
      book_id: bookId,
      user_id: userId,
      section_id: sectionId,
      section_type: sectionType
    }])
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .single();

  if (error) {
    console.error('Error starting editing session:', error);
    throw new Error('Failed to start editing session');
  }

  return data;
}

export async function endEditingSession(sectionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('editing_sessions')
    .delete()
    .eq('section_id', sectionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error ending editing session:', error);
    throw new Error('Failed to end editing session');
  }
}

export async function getBookEditingSessions(bookId: string): Promise<EditingSession[]> {
  const { data, error } = await supabase
    .from('editing_sessions')
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .eq('book_id', bookId)
    .gt('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 minutes

  if (error) {
    console.error('Error fetching editing sessions:', error);
    throw new Error('Failed to fetch editing sessions');
  }

  return data || [];
}

export async function updateEditingSession(
  sectionId: string,
  userId: string,
  cursorPosition?: any
): Promise<void> {
  const { error } = await supabase
    .from('editing_sessions')
    .update({
      last_activity: new Date().toISOString(),
      cursor_position: cursorPosition
    })
    .eq('section_id', sectionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating editing session:', error);
    // Don't throw error for session updates as they're non-critical
  }
}

/**
 * USER PRESENCE
 */

export async function updateUserPresence(
  bookId: string,
  userId: string,
  currentSection?: string,
  metadata?: any
): Promise<UserPresence> {
  const { data, error } = await supabase
    .from('user_presence')
    .upsert([{
      book_id: bookId,
      user_id: userId,
      current_section: currentSection,
      metadata: metadata,
      is_online: true
    }])
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .single();

  if (error) {
    console.error('Error updating user presence:', error);
    throw new Error('Failed to update presence');
  }

  return data;
}

export async function getBookPresence(bookId: string): Promise<UserPresence[]> {
  const { data, error } = await supabase
    .from('user_presence')
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .eq('book_id', bookId)
    .eq('is_online', true)
    .gt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

  if (error) {
    console.error('Error fetching book presence:', error);
    throw new Error('Failed to fetch presence');
  }

  return data || [];
}

export async function setUserOffline(bookId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_presence')
    .update({ is_online: false })
    .eq('book_id', bookId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error setting user offline:', error);
    // Don't throw error as this is often called during cleanup
  }
}

/**
 * COMMENTS
 */

export async function addBookComment(
  bookId: string,
  userId: string,
  sectionId: string,
  content: string,
  commentType: BookComment['comment_type'] = 'comment',
  positionStart?: number,
  positionEnd?: number,
  parentId?: string
): Promise<BookComment> {
  const { data, error } = await supabase
    .from('book_comments')
    .insert([{
      book_id: bookId,
      user_id: userId,
      section_id: sectionId,
      content,
      comment_type: commentType,
      position_start: positionStart,
      position_end: positionEnd,
      parent_id: parentId
    }])
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }

  return data;
}

export async function getBookComments(bookId: string, sectionId?: string): Promise<BookComment[]> {
  let query = supabase
    .from('book_comments')
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .eq('book_id', bookId)
    .is('parent_id', null) // Get top-level comments only
    .order('created_at', { ascending: true });

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('book_comments')
        .select(`
          *,
          user:users(id, email, display_name)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        ...comment,
        replies: replies || []
      };
    })
  );

  return commentsWithReplies;
}

export async function updateComment(
  commentId: string,
  content: string,
  status?: BookComment['status']
): Promise<BookComment> {
  const updates: any = { content };
  if (status) {
    updates.status = status;
  }

  const { data, error } = await supabase
    .from('book_comments')
    .update(updates)
    .eq('id', commentId)
    .select(`
      *,
      user:users(id, email, display_name)
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw new Error('Failed to update comment');
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('book_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment');
  }
}

/**
 * REAL-TIME SUBSCRIPTIONS
 */

export function subscribeToBookCollaboration(
  bookId: string,
  callbacks: {
    onCollaboratorUpdate?: (payload: any) => void;
    onInvitationUpdate?: (payload: any) => void;
    onPresenceUpdate?: (payload: any) => void;
    onEditingSessionUpdate?: (payload: any) => void;
    onCommentUpdate?: (payload: any) => void;
  }
) {
  const channels: any[] = [];

  // Subscribe to collaborators changes
  if (callbacks.onCollaboratorUpdate) {
    const collaboratorChannel = supabase
      .channel(`book_collaborators:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_collaborators',
          filter: `book_id=eq.${bookId}`
        },
        callbacks.onCollaboratorUpdate
      )
      .subscribe();
    channels.push(collaboratorChannel);
  }

  // Subscribe to presence changes
  if (callbacks.onPresenceUpdate) {
    const presenceChannel = supabase
      .channel(`user_presence:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `book_id=eq.${bookId}`
        },
        callbacks.onPresenceUpdate
      )
      .subscribe();
    channels.push(presenceChannel);
  }

  // Subscribe to editing sessions
  if (callbacks.onEditingSessionUpdate) {
    const sessionChannel = supabase
      .channel(`editing_sessions:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editing_sessions',
          filter: `book_id=eq.${bookId}`
        },
        callbacks.onEditingSessionUpdate
      )
      .subscribe();
    channels.push(sessionChannel);
  }

  // Subscribe to comments
  if (callbacks.onCommentUpdate) {
    const commentChannel = supabase
      .channel(`book_comments:${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_comments',
          filter: `book_id=eq.${bookId}`
        },
        callbacks.onCommentUpdate
      )
      .subscribe();
    channels.push(commentChannel);
  }

  // Return unsubscribe function
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}

/**
 * UTILITY FUNCTIONS
 */

export async function searchUsers(query: string, excludeUserIds: string[] = []): Promise<any[]> {
  let searchQuery = supabase
    .from('users')
    .select('id, email, display_name, role')
    .ilike('email', `%${query}%`)
    .limit(10);

  if (excludeUserIds.length > 0) {
    searchQuery = searchQuery.not('id', 'in', `(${excludeUserIds.join(',')})`);
  }

  const { data, error } = await searchQuery;

  if (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }

  return data || [];
}

export async function cleanupExpiredData(): Promise<void> {
  try {
    // Cleanup expired invitations
    await supabase.rpc('cleanup_expired_invitations');
    
    // Cleanup stale editing sessions
    await supabase.rpc('cleanup_stale_editing_sessions');
    
    // Cleanup offline presence
    await supabase.rpc('cleanup_offline_presence');
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
  }
}