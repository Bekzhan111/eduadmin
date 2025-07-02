'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Trash2, Edit, Crown, UserPlus,
  Eye, EyeOff, Clock, CheckCircle, XCircle, Search, AlertCircle
} from 'lucide-react';
import { 
  CollaboratorRole, 
  BookCollaborator,
  CollaborationInvitation
} from '@/components/book-editor/types';
import { useCollaboration } from '@/hooks/useCollaboration';
import { 
  ROLE_CONFIGS, 
  hasPermission, 
  canManageCollaborator, 
  canChangeRole,
  getAssignableRoles,
  isValidEmail,
  getUserDisplayName,
  getUserInitials,
  sortCollaborators
} from '@/utils/collaboration';

type UserSearchResult = {
  id: string;
  email: string;
  display_name?: string;
  role: string;
};

interface BookCollaboratorsProps {
  bookId: string;
  className?: string;
}

export function BookCollaborators({ 
  bookId, 
  className = '' 
}: BookCollaboratorsProps) {
  // Use the collaboration hook
  const {
    collaborators,
    invitations,
    currentUser,
    isLoading,
    error: collaborationError,
    inviteCollaborator,
    removeCollaborator,
    changeCollaboratorRole
  } = useCollaboration({ bookId });

  // Local state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  // Combined error state
  const error = collaborationError || localError;

  // Check if current user can invite
  const canInvite = currentUser && hasPermission(currentUser, 'canInvite');
  
  // Get sorted collaborators
  const sortedCollaborators = sortCollaborators(collaborators);
  
  // Get assignable roles for current user
  const assignableRoles = getAssignableRoles(currentUser);

  // Search users by email (simplified version for now)
  const searchUsers = async (email: string) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // For now, just validate email format
      if (isValidEmail(email)) {
        // Check if user is already a collaborator
        const existingCollaborator = collaborators.find(c => 
          c.user?.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (!existingCollaborator) {
          setSearchResults([{
            id: 'temp',
            email: email,
            display_name: email.split('@')[0],
            role: 'user'
          }]);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle invite collaborator
  const handleInviteCollaborator = async (userEmail: string, role: CollaboratorRole) => {
    setIsInviting(true);
    setLocalError('');
    setSuccess('');

    try {
      // Validate email
      if (!isValidEmail(userEmail)) {
        throw new Error('Неверный формат email');
      }

      // Check if user is already a collaborator
      const existingCollaborator = collaborators.find(c => 
        c.user?.email?.toLowerCase() === userEmail.toLowerCase()
      );
      
      if (existingCollaborator) {
        throw new Error('Этот пользователь уже является соавтором');
      }

      // Use the hook to invite collaborator
      await inviteCollaborator(userEmail, role);
      
      setSuccess(`Приглашение отправлено пользователю ${userEmail}`);
      setInviteEmail('');
      setSearchResults([]);
      
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка при отправке приглашения');
    } finally {
      setIsInviting(false);
    }
  };

  // Handle remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого соавтора?')) {
      return;
    }

    try {
      await removeCollaborator(collaboratorId);
      setSuccess('Соавтор удален');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка при удалении соавтора');
    }
  };

  // Handle change collaborator role
  const handleChangeCollaboratorRole = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      await changeCollaboratorRole(collaboratorId, newRole);
      setSuccess('Роль соавтора изменена');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка при изменении роли');
    }
  };

  // Get role badge
  const getRoleBadge = (role: CollaboratorRole) => {
    const config = ROLE_CONFIGS[role];
    return (
      <Badge className={`${config.color} text-white`}>
        {role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
        {role === 'editor' && <Edit className="h-3 w-3 mr-1" />}
        {role === 'reviewer' && <Eye className="h-3 w-3 mr-1" />}
        {role === 'viewer' && <EyeOff className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setLocalError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Загрузка...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Соавторы ({collaborators.length})
        </CardTitle>
        <CardDescription>
          Управление доступом к редактированию книги
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite new collaborator */}
        {canInvite && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Пригласить соавтора</Label>
              <div className="flex space-x-2 mt-1">
                <div className="flex-1 relative">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="Введите email пользователя"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Search results dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setInviteEmail(user.email);
                            setSearchResults([]);
                          }}
                        >
                          <div className="font-medium">{user.display_name || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.role === 'author' ? 'Автор' : user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {assignableRoles.map(role => (
                    <option key={role} value={role}>
                      {ROLE_CONFIGS[role].label}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={() => handleInviteCollaborator(inviteEmail, inviteRole)}
                  disabled={!inviteEmail || isInviting}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isInviting ? 'Отправка...' : 'Пригласить'}
                </Button>
              </div>
            </div>

            {/* Role descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {assignableRoles.map((role) => {
                const config = ROLE_CONFIGS[role];
                return (
                  <div key={role} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium flex items-center">
                      {getRoleBadge(role)}
                    </div>
                    <div className="text-gray-600 mt-1">{config.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
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

        {/* Collaborators list */}
        <div className="space-y-3">
          {sortedCollaborators.length > 0 ? (
            sortedCollaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {collaborator.user ? (
                      getUserInitials(collaborator.user.display_name, collaborator.user.email)
                    ) : (
                      <Users className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {collaborator.user ? 
                        getUserDisplayName(collaborator.user) : 
                        'Неизвестный пользователь'
                      }
                    </div>
                    <div className="text-sm text-gray-500">{collaborator.user?.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(collaborator.role)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {currentUser && canManageCollaborator(currentUser, collaborator) && (
                  <div className="flex items-center space-x-2">
                    {/* Change role */}
                    {canChangeRole(currentUser, collaborator, inviteRole) && (
                      <select
                        value={collaborator.role}
                        onChange={(e) => handleChangeCollaboratorRole(collaborator.id, e.target.value as CollaboratorRole)}
                        className="text-sm px-2 py-1 border rounded"
                      >
                        {assignableRoles.map(role => (
                          <option key={role} value={role}>
                            {ROLE_CONFIGS[role].label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет соавторов</p>
              <p className="text-sm">Пригласите других пользователей для совместной работы</p>
            </div>
          )}
        </div>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Ожидающие приглашения ({invitations.length})
            </h4>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <div className="font-medium">{invitation.invitee_email}</div>
                    <div className="text-sm text-gray-500">
                      Приглашен как {ROLE_CONFIGS[invitation.role].label.toLowerCase()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Ожидает
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions summary */}
        {sortedCollaborators.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Права доступа</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="font-medium">Роль</div>
              <div className="font-medium">Редактирование</div>
              <div className="font-medium">Рецензирование</div>
              <div className="font-medium">Приглашения</div>
              <div className="font-medium">Публикация</div>
              
              {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                <React.Fragment key={role}>
                  <div>{config.label}</div>
                  <div>{config.permissions.canEdit ? '✅' : '❌'}</div>
                  <div>{config.permissions.canReview ? '✅' : '❌'}</div>
                  <div>{config.permissions.canInvite ? '✅' : '❌'}</div>
                  <div>{config.permissions.canPublish ? '✅' : '❌'}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
