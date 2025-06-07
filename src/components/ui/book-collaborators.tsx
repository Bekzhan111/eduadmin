'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Plus, Trash2, Edit, Crown, UserCheck, UserX, Mail, Search,
  Shield, Eye, EyeOff, Settings, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase';

export type CollaboratorRole = 'owner' | 'editor' | 'reviewer' | 'viewer';

type UserSearchResult = {
  id: string;
  email: string;
  display_name?: string;
  role: string;
};

export type BookCollaborator = {
  id: string;
  user_id: string;
  book_id: string;
  role: CollaboratorRole;
  permissions: {
    canEdit: boolean;
    canReview: boolean;
    canInvite: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at?: string;
  invited_by: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
};

interface BookCollaboratorsProps {
  bookId: string;
  currentUserId: string;
  collaborators: BookCollaborator[];
  onCollaboratorsChange: (collaborators: BookCollaborator[]) => void;
  isOwner?: boolean;
}

export function BookCollaborators({ 
  bookId, 
  currentUserId, 
  collaborators, 
  onCollaboratorsChange,
  isOwner = false 
}: BookCollaboratorsProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();

  // Role configurations
  const roleConfigs = {
    owner: {
      label: 'Владелец',
      description: 'Полный доступ ко всем функциям',
      color: 'bg-yellow-500',
      permissions: {
        canEdit: true,
        canReview: true,
        canInvite: true,
        canDelete: true,
        canPublish: true,
      }
    },
    editor: {
      label: 'Редактор',
      description: 'Может редактировать содержимое',
      color: 'bg-blue-500',
      permissions: {
        canEdit: true,
        canReview: true,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      }
    },
    reviewer: {
      label: 'Рецензент',
      description: 'Может оставлять комментарии и предложения',
      color: 'bg-green-500',
      permissions: {
        canEdit: false,
        canReview: true,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      }
    },
    viewer: {
      label: 'Наблюдатель',
      description: 'Только просмотр',
      color: 'bg-gray-500',
      permissions: {
        canEdit: false,
        canReview: false,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      }
    }
  };

  // Search users by email
  const searchUsers = async (email: string) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, display_name, role')
        .ilike('email', `%${email}%`)
        .neq('id', currentUserId) // Exclude current user
        .limit(5);

      if (error) throw error;

      // Filter out users who are already collaborators
      const existingUserIds = collaborators.map(c => c.user_id);
      const filteredUsers = users?.filter(user => !existingUserIds.includes(user.id)) || [];
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Invite collaborator
  const inviteCollaborator = async (userEmail: string, role: CollaboratorRole) => {
    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      // First, find the user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, display_name')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        throw new Error('Пользователь с таким email не найден');
      }

      // Check if already a collaborator
      const existingCollaborator = collaborators.find(c => c.user_id === user.id);
      if (existingCollaborator) {
        throw new Error('Этот пользователь уже является соавтором');
      }

      // Create collaboration invitation
      const newCollaborator: BookCollaborator = {
        id: `temp_${Date.now()}`,
        user_id: user.id,
        book_id: bookId,
        role,
        permissions: roleConfigs[role].permissions,
        status: 'pending',
        invited_at: new Date().toISOString(),
        invited_by: currentUserId,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
        }
      };

      // TODO: Save to database
      // const { error: insertError } = await supabase
      //   .from('book_collaborators')
      //   .insert([newCollaborator]);

      // For now, just update local state
      onCollaboratorsChange([...collaborators, newCollaborator]);
      
      setSuccess(`Приглашение отправлено пользователю ${userEmail}`);
      setInviteEmail('');
      setSearchResults([]);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при отправке приглашения');
    } finally {
      setIsInviting(false);
    }
  };

  // Remove collaborator
  const removeCollaborator = async (collaboratorId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого соавтора?')) {
      return;
    }

    try {
      // TODO: Remove from database
      // await supabase
      //   .from('book_collaborators')
      //   .delete()
      //   .eq('id', collaboratorId);

      // Update local state
      const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
      onCollaboratorsChange(updatedCollaborators);
      
      setSuccess('Соавтор удален');
    } catch (error) {
      setError('Ошибка при удалении соавтора');
    }
  };

  // Change collaborator role
  const changeCollaboratorRole = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      const updatedCollaborators = collaborators.map(c => {
        if (c.id === collaboratorId) {
          return {
            ...c,
            role: newRole,
            permissions: roleConfigs[newRole].permissions
          };
        }
        return c;
      });

      onCollaboratorsChange(updatedCollaborators);
      setSuccess('Роль соавтора изменена');
    } catch (error) {
      setError('Ошибка при изменении роли');
    }
  };

  // Get status badge
  const getStatusBadge = (status: BookCollaborator['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Принято</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Отклонено</Badge>;
      default:
        return null;
    }
  };

  // Get role badge
  const getRoleBadge = (role: CollaboratorRole) => {
    const config = roleConfigs[role];
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

  return (
    <Card>
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
        {isOwner && (
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
                  <option value="editor">Редактор</option>
                  <option value="reviewer">Рецензент</option>
                  <option value="viewer">Наблюдатель</option>
                </select>
                
                <Button
                  onClick={() => inviteCollaborator(inviteEmail, inviteRole)}
                  disabled={!inviteEmail || isInviting}
                >
                  {isInviting ? 'Отправка...' : 'Пригласить'}
                </Button>
              </div>
            </div>

            {/* Role descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {Object.entries(roleConfigs).filter(([key]) => key !== 'owner').map(([key, config]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium flex items-center">
                    {getRoleBadge(key as CollaboratorRole)}
                  </div>
                  <div className="text-gray-600 mt-1">{config.description}</div>
                </div>
              ))}
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
          {collaborators.length > 0 ? (
            collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {collaborator.user?.display_name || collaborator.user?.email || 'Неизвестный пользователь'}
                    </div>
                    <div className="text-sm text-gray-500">{collaborator.user?.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(collaborator.role)}
                      {getStatusBadge(collaborator.status)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && collaborator.role !== 'owner' && (
                  <div className="flex items-center space-x-2">
                    {/* Change role */}
                    <select
                      value={collaborator.role}
                      onChange={(e) => changeCollaboratorRole(collaborator.id, e.target.value as CollaboratorRole)}
                      className="text-sm px-2 py-1 border rounded"
                    >
                      <option value="editor">Редактор</option>
                      <option value="reviewer">Рецензент</option>
                      <option value="viewer">Наблюдатель</option>
                    </select>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaborator(collaborator.id)}
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

        {/* Permissions summary */}
        {collaborators.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Права доступа</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="font-medium">Роль</div>
              <div className="font-medium">Редактирование</div>
              <div className="font-medium">Рецензирование</div>
              <div className="font-medium">Приглашения</div>
              <div className="font-medium">Публикация</div>
              
              {Object.entries(roleConfigs).map(([role, config]) => (
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