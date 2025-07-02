'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Mail, 
  Clock, 
  Check, 
  X, 
  BookOpen, 
  User, 
  Calendar,
  RefreshCw,
  Edit,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type Invitation = {
  id: string;
  book_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id: string | null;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  permissions: {
    canEdit: boolean;
    canReview: boolean;
    canInvite: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  book?: {
    title: string;
    description: string;
    author_name?: string;
  };
  inviter?: {
    display_name: string;
    email: string;
  };
};

export default function InvitationsPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      // Get invitations for the current user (by email or user ID)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('collaboration_invitations')
        .select('*')
        .or(`invitee_email.eq.${userProfile.email},invitee_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        throw new Error(`Failed to fetch invitations: ${invitationsError.message}`);
      }

      // For each invitation, get the book and inviter information
      const formattedInvitations = await Promise.all(
        (invitationsData || []).map(async (invitation) => {
          // Get book information
          const { data: bookData } = await supabase
            .from('books')
            .select('title, description, author_id')
            .eq('id', invitation.book_id)
            .single();

          // Get inviter information
          const { data: inviterData } = await supabase
            .from('users')
            .select('display_name, email')
            .eq('id', invitation.inviter_id)
            .single();

          // Get book author information if available
          let authorName = 'Unknown Author';
          if (bookData?.author_id) {
            const { data: authorData } = await supabase
              .from('users')
              .select('display_name, email')
              .eq('id', bookData.author_id)
              .single();
            
            authorName = authorData?.display_name || authorData?.email || 'Unknown Author';
          }

          return {
            ...invitation,
            book: {
              title: bookData?.title || 'Unknown Book',
              description: bookData?.description || '',
              author_name: authorName
            },
            inviter: {
              display_name: inviterData?.display_name || inviterData?.email || 'Unknown User',
              email: inviterData?.email || ''
            }
          };
        })
      );

      setInvitations(formattedInvitations);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      setError(null);
      const supabase = createClient();

      const { error } = await supabase.rpc(
        action === 'accept' ? 'accept_collaboration_invitation' : 'reject_collaboration_invitation',
        { invitation_uuid: invitationId }
      );

      if (error) {
        throw new Error(`Failed to ${action} invitation: ${error.message}`);
      }

      setSuccess(`Invitation ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
      await fetchInvitations(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(`Error ${action}ing invitation:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} invitation`);
    }
  };

  const handleEditBook = (invitation: Invitation) => {
    try {
      // Use the book ID directly - BookEditor will handle the lookup
      router.push(`/dashboard/books/${invitation.book_id}/edit`);
    } catch (err) {
      console.error('Error navigating to book editor:', err);
      setError('Failed to open book editor');
    }
  };

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchInvitations();
    }
  }, [authLoading, userProfile]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'reviewer':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'accepted':
        return 'Принято';
      case 'rejected':
        return 'Отклонено';
      case 'expired':
        return 'Истекло';
      default:
        return status;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at));
  const pastInvitations = invitations.filter(inv => inv.status !== 'pending' || isExpired(inv.expires_at));

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка приглашений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Приглашения к совместной работе
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Управляйте приглашениями для совместной работы над книгами
          </p>
        </div>
        <Button onClick={fetchInvitations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего приглашений</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают ответа</p>
                <p className="text-2xl font-bold">{pendingInvitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Принято</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(inv => inv.status === 'accepted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Отклонено</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(inv => inv.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Ожидающие ответа ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Приглашения, требующие вашего решения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">
                          {invitation.book?.title || 'Unknown Book'}
                        </h3>
                        <Badge className={getRoleColor(invitation.role)}>
                          {translateRole(invitation.role)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-2">
                        {invitation.book?.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>От: {invitation.inviter?.display_name || invitation.inviter?.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {formatDistanceToNow(new Date(invitation.created_at), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </span>
                        </div>
                      </div>

                      {invitation.message && (
                        <div className="bg-white p-3 rounded border mb-3">
                          <p className="text-sm italic">"{invitation.message}"</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Истекает: {formatDistanceToNow(new Date(invitation.expires_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Принять
                      </Button>
                      <Button
                        onClick={() => handleInvitationResponse(invitation.id, 'reject')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>История приглашений</CardTitle>
          <CardDescription>
            Все ваши приглашения к совместной работе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastInvitations.length === 0 && pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>У вас нет приглашений к совместной работе</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Книга</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>От кого</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invitation.book?.title || 'Unknown Book'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invitation.book?.author_name && `Автор: ${invitation.book.author_name}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(invitation.role)}>
                          {translateRole(invitation.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invitation.inviter?.display_name || invitation.inviter?.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(
                          isExpired(invitation.expires_at) && invitation.status === 'pending' 
                            ? 'expired' 
                            : invitation.status
                        )}>
                          {translateStatus(
                            isExpired(invitation.expires_at) && invitation.status === 'pending' 
                              ? 'expired' 
                              : invitation.status
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(invitation.created_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'accepted' && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEditBook(invitation)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Редактировать
                            </Button>
                            <Button
                              onClick={() => router.push(`/dashboard/books`)}
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              К книгам
                            </Button>
                          </div>
                        )}
                        {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                          <Badge variant="outline" className="text-orange-600">
                            Ожидает ответа
                          </Badge>
                        )}
                        {(invitation.status === 'rejected' || isExpired(invitation.expires_at)) && (
                          <span className="text-gray-400 text-sm">
                            Недоступно
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}