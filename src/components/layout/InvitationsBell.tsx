'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Bell, Mail, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type PendingInvitation = {
  id: string;
  book_id: string;
  role: string;
  created_at: string;
  expires_at: string;
  message: string | null;
  inviter_id: string;
  book?: {
    title: string;
  };
  inviter?: {
    display_name: string;
    email: string;
  };
};

export default function InvitationsBell() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingInvitations = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      console.log('Fetching invitations for user:', {
        email: userProfile.email,
        id: userProfile.id
      });

      const { data, error } = await supabase
        .from('collaboration_invitations')
        .select('*')
        .or(`invitee_email.eq.${userProfile.email},invitee_id.eq.${userProfile.id}`)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5); // Only show latest 5 invitations in dropdown

      console.log('Query result:', { 
        dataLength: data?.length || 0, 
        error: error?.message || 'none' 
      });

      if (error) {
        console.error('Error fetching pending invitations:', error.message || error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      // Get book and inviter information for each invitation
      const invitationsWithDetails = await Promise.all(
        (data || []).map(async (invitation) => {
          const [bookResult, inviterResult] = await Promise.all([
            supabase
              .from('books')
              .select('title')
              .eq('id', invitation.book_id)
              .single(),
            supabase
              .from('users')
              .select('display_name, email')
              .eq('id', invitation.inviter_id)
              .single()
          ]);

          return {
            ...invitation,
            book: bookResult.data || { title: 'Unknown Book' },
            inviter: inviterResult.data || { display_name: 'Unknown User', email: '' }
          };
        })
      );

      setPendingInvitations(invitationsWithDetails);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchPendingInvitations();
      
      // Set up real-time subscription for invitation updates
      const supabase = createClient();
      const channel = supabase
        .channel('user_invitations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collaboration_invitations',
          },
          () => {
            fetchPendingInvitations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile]);

  const translateRole = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Владелец';
      case 'editor':
        return 'Редактор';
      case 'reviewer':
        return 'Рецензент';
      case 'viewer':
        return 'Наблюдатель';
      default:
        return role;
    }
  };

  const handleViewAllInvitations = () => {
    router.push('/dashboard/invitations');
  };

  const handleInvitationClick = (invitationId: string) => {
    router.push(`/dashboard/invitations#invitation-${invitationId}`);
  };

  if (!userProfile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {pendingInvitations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingInvitations.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Приглашения
          </span>
          {pendingInvitations.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingInvitations.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Загрузка...
            </div>
          </DropdownMenuItem>
        ) : pendingInvitations.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-gray-500 text-sm">
              Нет новых приглашений
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            {pendingInvitations.map((invitation) => (
              <DropdownMenuItem
                key={invitation.id}
                onClick={() => handleInvitationClick(invitation.id)}
                className="cursor-pointer p-3"
              >
                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {invitation.book?.title || 'Unknown Book'}
                    </span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {translateRole(invitation.role)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    <span className="truncate">
                      {invitation.inviter?.display_name || invitation.inviter?.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(invitation.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                  
                  {invitation.message && (
                    <div className="text-xs text-gray-600 italic truncate">
                      "{invitation.message}"
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleViewAllInvitations}
              className="cursor-pointer text-center font-medium text-blue-600 hover:text-blue-700"
            >
              Посмотреть все приглашения
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}