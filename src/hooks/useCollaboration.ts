import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookCollaborator, 
  CollaborationInvitation, 
  CollaboratorRole,
  CollaboratorPermissions
} from '@/components/book-editor/types';
import { getDefaultPermissions } from '@/utils/collaboration';

interface UseCollaborationOptions {
  bookId: string;
  autoLoad?: boolean;
}

interface UseCollaborationReturn {
  collaborators: BookCollaborator[];
  invitations: CollaborationInvitation[];
  currentUserRole: CollaboratorRole | null;
  currentUserPermissions: CollaboratorPermissions | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCollaborators: () => Promise<void>;
  loadInvitations: () => Promise<void>;
  inviteCollaborator: (email: string, role: CollaboratorRole, message?: string) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  changeCollaboratorRole: (collaboratorId: string, newRole: CollaboratorRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  clearError: () => void;
}

export const useCollaboration = ({ 
  bookId, 
  autoLoad = true 
}: UseCollaborationOptions): UseCollaborationReturn => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<BookCollaborator[]>([]);
  const [invitations, setInvitations] = useState<CollaborationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelsRef = useRef<{ collaborators?: any; invitations?: any }>({});

  const supabase = createClient();

  // Get current user's role and permissions
  const currentUserRole = collaborators.find(c => c.user_id === user?.id)?.role || null;
  const currentUserPermissions = currentUserRole ? getDefaultPermissions(currentUserRole) : null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadCollaborators = useCallback(async () => {
    if (!bookId || !bookId.trim()) return;
    
    try {
      setIsLoading(true);
      // Query collaborators without relationships first
      let { data, error } = await supabase
        .from('book_collaborators')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching collaborators:', error.message);
      } else if (data) {
        // Fetch user data separately for each collaborator
        const collaboratorsWithUsers = await Promise.all(
          data.map(async (collaborator) => {
            // Try public.users table first (more likely to have display_name)
            let userData = null;
            
            const { data: publicUserData } = await supabase
              .from('users')
              .select('id, email, display_name')
              .eq('id', collaborator.user_id)
              .single();
            
            if (publicUserData) {
              userData = publicUserData;
            } else {
              // Fallback to auth.users if public.users doesn't work
              const { data: authUserData } = await supabase
                .from('auth.users')
                .select('id, email')
                .eq('id', collaborator.user_id)
                .single();
              
              userData = authUserData;
            }
            
            return {
              ...collaborator,
              user: userData || { id: collaborator.user_id, email: 'Unknown', display_name: 'Unknown User' }
            };
          })
        );

        // Get book info to check if current user is the author
        const { data: bookData } = await supabase
          .from('books')
          .select('author_id')
          .eq('id', bookId)
          .single();

        // If current user is the book author, ensure they're included as owner
        if (bookData?.author_id && user?.id === bookData.author_id) {
          const isAuthorInList = collaboratorsWithUsers.some(c => c.user_id === user.id);
          
          if (!isAuthorInList) {
            // Get author user data
            const { data: authorData } = await supabase
              .from('users')
              .select('id, email, display_name')
              .eq('id', user.id)
              .single();

            // Add author as owner to the collaborators list
            collaboratorsWithUsers.unshift({
              id: `owner_${user.id}`,
              book_id: bookId,
              user_id: user.id,
              role: 'owner',
              permissions: {
                canEdit: true,
                canReview: true,
                canInvite: true,
                canDelete: true,
                canPublish: true
              },
              invited_by: null,
              joined_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              user: authorData || { id: user.id, email: user.email || 'Unknown', display_name: 'Book Author' }
            });
          }
        }
        
        data = collaboratorsWithUsers;
      }

      if (error) {
        console.warn('Collaborators table may not exist yet:', error.message);
        console.warn('Full error:', error);
        setCollaborators([]);
      } else {
        console.log('Loaded collaborators:', data?.length || 0, 'collaborators');
        setCollaborators(data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load collaborators:', err?.message);
      setCollaborators([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, supabase]);

  const loadInvitations = useCallback(async () => {
    if (!bookId || !bookId.trim() || !user) return;
    
    try {
      // Query invitations without relationships first
      const { data, error } = await supabase
        .from('collaboration_invitations')
        .select('*')
        .eq('book_id', bookId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Invitations table may not exist yet:', error.message);
        setInvitations([]);
      } else if (data) {
        // Fetch related data separately for each invitation
        const invitationsWithDetails = await Promise.all(
          data.map(async (invitation) => {
            // Get book data
            const { data: bookData } = await supabase
              .from('books')
              .select('id, title, base_url')
              .eq('id', invitation.book_id)
              .single();
            
            // Get inviter data (try auth.users first, then public.users)
            let inviterData = null;
            const { data: authInviterData } = await supabase
              .from('auth.users')
              .select('id, email')
              .eq('id', invitation.inviter_id)
              .single();
            
            if (authInviterData) {
              inviterData = authInviterData;
            } else {
              const { data: publicInviterData } = await supabase
                .from('users')
                .select('id, email, display_name')
                .eq('id', invitation.inviter_id)
                .single();
              
              inviterData = publicInviterData;
            }
            
            return {
              ...invitation,
              book: bookData || { id: invitation.book_id, title: 'Unknown Book' },
              inviter: inviterData || { id: invitation.inviter_id, email: 'Unknown' }
            };
          })
        );
        
        setInvitations(invitationsWithDetails);
      } else {
        setInvitations([]);
      }
    } catch (err: any) {
      console.warn('Failed to load invitations:', err?.message);
      setInvitations([]);
    }
  }, [bookId, user, supabase]);

  const inviteCollaborator = useCallback(async (
    email: string, 
    role: CollaboratorRole, 
    message?: string
  ) => {
    if (!user || !bookId) return;
    
    try {
      setIsLoading(true);
      
      const invitationData = {
        book_id: bookId,
        inviter_id: user.id,
        invitee_email: email,
        role,
        permissions: getDefaultPermissions(role),
        message,
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const { error } = await supabase
        .from('collaboration_invitations')
        .insert([invitationData]);

      if (error) throw error;
      
      // Reload invitations to show the new one
      await loadInvitations();
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, bookId, supabase, loadInvitations]);

  const removeCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('book_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      
      // Remove from local state
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    } catch (err: any) {
      setError(err?.message || 'Failed to remove collaborator');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const changeCollaboratorRole = useCallback(async (
    collaboratorId: string, 
    newRole: CollaboratorRole
  ) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('book_collaborators')
        .update({ 
          role: newRole,
          permissions: getDefaultPermissions(newRole)
        })
        .eq('id', collaboratorId);

      if (error) throw error;
      
      // Update local state
      setCollaborators(prev => 
        prev.map(c => c.id === collaboratorId 
          ? { ...c, role: newRole, permissions: getDefaultPermissions(newRole) }
          : c
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to change role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.rpc('accept_collaboration_invitation', {
        invitation_uuid: invitationId
      });

      if (error) throw error;
      
      // Reload both collaborators and invitations
      await Promise.all([loadCollaborators(), loadInvitations()]);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, loadCollaborators, loadInvitations]);

  const rejectInvitation = useCallback(async (invitationId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.rpc('reject_collaboration_invitation', {
        invitation_uuid: invitationId
      });

      if (error) throw error;
      
      // Remove from local state
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err: any) {
      setError(err?.message || 'Failed to reject invitation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Auto-load data when component mounts or bookId changes
  useEffect(() => {
    if (autoLoad && bookId) {
      loadCollaborators();
      loadInvitations();
    }
  }, [autoLoad, bookId, loadCollaborators, loadInvitations]);

  // Set up real-time subscriptions for collaborators and invitations
  useEffect(() => {
    if (!bookId) return;

    // Cleanup existing channels first
    if (channelsRef.current.collaborators) {
      supabase.removeChannel(channelsRef.current.collaborators);
    }
    if (channelsRef.current.invitations) {
      supabase.removeChannel(channelsRef.current.invitations);
    }

    // Subscribe to book_collaborators changes
    const collaboratorsChannel = supabase
      .channel(`collaborators_${bookId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_collaborators',
          filter: `book_id=eq.${bookId}`
        },
        () => {
          console.log('Collaborators changed, reloading...');
          loadCollaborators();
        }
      )
      .subscribe();

    // Subscribe to collaboration_invitations changes
    const invitationsChannel = supabase
      .channel(`invitations_${bookId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_invitations',
          filter: `book_id=eq.${bookId}`
        },
        () => {
          console.log('Invitations changed, reloading...');
          loadInvitations();
        }
      )
      .subscribe();

    // Store channel references
    channelsRef.current = {
      collaborators: collaboratorsChannel,
      invitations: invitationsChannel
    };

    return () => {
      if (channelsRef.current.collaborators) {
        supabase.removeChannel(channelsRef.current.collaborators);
      }
      if (channelsRef.current.invitations) {
        supabase.removeChannel(channelsRef.current.invitations);
      }
      channelsRef.current = {};
    };
  }, [bookId, supabase, loadCollaborators, loadInvitations]);

  return {
    collaborators,
    invitations,
    currentUserRole,
    currentUserPermissions,
    isLoading,
    error,
    loadCollaborators,
    loadInvitations,
    inviteCollaborator,
    removeCollaborator,
    changeCollaboratorRole,
    acceptInvitation,
    rejectInvitation,
    clearError
  };
};