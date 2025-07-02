import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  X, 
  Mail, 
  Crown, 
  Edit3, 
  Eye,
  MessageSquare,
  MoreHorizontal,
  UserPlus,
  Trash2
} from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { 
  CollaboratorRole, 
  BookCollaborator 
} from '@/components/book-editor/types';
import { 
  formatUserName, 
  formatRole, 
  getAvatarColor, 
  canManageRole
} from '@/utils/collaboration';

interface CollaborationPanelProps {
  bookId: string;
  className?: string;
  userRole?: string; // Add user role as prop
  isBookAuthor?: boolean; // Add book author check as prop
}

const ROLE_ICONS = {
  owner: Crown,
  editor: Edit3,
  reviewer: MessageSquare,
  viewer: Eye,
};

const ROLE_OPTIONS: { value: CollaboratorRole; label: string; description: string }[] = [
  { value: 'editor', label: 'Редактор', description: 'Может редактировать и приглашать' },
  { value: 'reviewer', label: 'Рецензент', description: 'Может оставлять комментарии' },
  { value: 'viewer', label: 'Читатель', description: 'Только просмотр' },
];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  bookId,
  className = "",
  userRole,
  isBookAuthor = false
}) => {
  // Early return if bookId is invalid
  if (!bookId || !bookId.trim()) {
    return (
      <div className={`bg-white h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Соавторы</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8 text-gray-500">
            <p>Функция соавторства недоступна</p>
            <p className="text-sm mt-1">Отсутствует идентификатор книги</p>
          </div>
        </div>
      </div>
    );
  }
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [expandedCollaborator, setExpandedCollaborator] = useState<string | null>(null);

  const {
    collaborators,
    currentUserRole,
    currentUserPermissions,
    isLoading,
    error,
    inviteCollaborator,
    removeCollaborator,
    changeCollaboratorRole,
    clearError
  } = useCollaboration({ bookId });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await inviteCollaborator(inviteEmail.trim(), inviteRole, inviteMessage.trim() || undefined);
      setInviteEmail('');
      setInviteMessage('');
      setShowInviteForm(false);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to invite collaborator:', err);
      // Don't throw the error to prevent page crashes
    }
  };

  const handleShowInviteForm = () => {
    try {
      setShowInviteForm(true);
    } catch (err) {
      console.error('Error showing invite form:', err);
    }
  };

  const handleHideInviteForm = () => {
    try {
      setShowInviteForm(false);
      setInviteEmail('');
      setInviteMessage('');
    } catch (err) {
      console.error('Error hiding invite form:', err);
    }
  };

  const handleRemoveCollaborator = async (collaborator: BookCollaborator) => {
    if (!window.confirm(`Удалить ${formatUserName(collaborator.user)} из соавторов?`)) {
      return;
    }
    
    try {
      await removeCollaborator(collaborator.id);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
    }
  };

  const handleChangeRole = async (collaborator: BookCollaborator, newRole: CollaboratorRole) => {
    try {
      await changeCollaboratorRole(collaborator.id, newRole);
      setExpandedCollaborator(null);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const canInvite = currentUserPermissions?.canInvite || 
                    currentUserRole === 'owner' || 
                    currentUserRole === 'editor' ||
                    userRole === 'author' ||
                    isBookAuthor;

  // Error boundary wrapper
  if (error) {
    return (
      <div className={`bg-white h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Соавторы</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8 text-red-500">
            <p>Ошибка загрузки соавторов</p>
            <Button onClick={clearError} className="mt-2">
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Соавторы</h3>
          <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
            {collaborators.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-700 text-sm">{error}</p>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Invite Button - Always show for testing */}
          {!showInviteForm && (
            <div className="mb-6">
              <Button 
                onClick={handleShowInviteForm}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
                data-invite-button
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Пригласить соавтора
              </Button>
            </div>
          )}

          {/* Invite Form */}
          {showInviteForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Пригласить нового соавтора</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Роль
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сообщение (необязательно)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Добавьте персональное сообщение..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleInvite} disabled={isLoading || !inviteEmail.trim()}>
                    <Mail className="w-4 h-4 mr-2" />
                    Отправить приглашение
                  </Button>
                  <Button variant="outline" onClick={handleHideInviteForm}>
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">Текущие соавторы</h3>
            
            
            {collaborators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Пока нет соавторов</p>
                {canInvite && (
                  <p className="text-sm mt-1">Нажмите кнопку выше, чтобы пригласить соавтора</p>
                )}
              </div>
            ) : (
              collaborators.map((collaborator) => {
                try {
                  const RoleIcon = ROLE_ICONS[collaborator.role] || Users;
                  const avatarColor = getAvatarColor(collaborator.user_id);
                  const userName = formatUserName(collaborator.user);
                  const canManageThisRole = currentUserRole && canManageRole(currentUserRole, collaborator.role);
                  
                  return (
                  <div key={collaborator.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{userName}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <RoleIcon className="w-3 h-3" />
                              {formatRole(collaborator.role)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{collaborator.user?.email}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {canManageThisRole && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCollaborator(
                              expandedCollaborator === collaborator.id ? null : collaborator.id
                            )}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Actions */}
                    {expandedCollaborator === collaborator.id && canManageThisRole && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Изменить роль
                            </label>
                            <select
                              value={collaborator.role}
                              onChange={(e) => handleChangeRole(collaborator, e.target.value as CollaboratorRole)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white"
                              disabled={isLoading}
                            >
                              <option value={collaborator.role}>
                                {formatRole(collaborator.role)} (текущая)
                              </option>
                              {ROLE_OPTIONS.map(role => (
                                role.value !== collaborator.role && (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                )
                              ))}
                            </select>
                          </div>
                          
                          {collaborator.role !== 'owner' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCollaborator(collaborator)}
                              disabled={isLoading}
                              className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить из соавторов
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                } catch (err) {
                  console.error('Error rendering collaborator:', err, collaborator);
                  return (
                    <div key={collaborator.id || 'error'} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <p className="text-red-600 text-sm">Ошибка отображения соавтора</p>
                    </div>
                  );
                }
              })
            )}
          </div>
      </div>
    </div>
  );
};