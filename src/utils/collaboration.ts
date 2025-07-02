import { CollaboratorRole, CollaboratorPermissions, BookCollaborator, CollaborationInvitation, EditingSession, UserPresence, BookComment } from '@/components/book-editor/types';
import { Crown, Edit, Eye, EyeOff } from 'lucide-react';

// Permission utilities
export const getDefaultPermissions = (role: CollaboratorRole): CollaboratorPermissions => {
  switch (role) {
    case 'owner':
      return {
        canEdit: true,
        canReview: true,
        canInvite: true,
        canDelete: true,
        canPublish: true,
      };
    case 'editor':
      return {
        canEdit: true,
        canReview: true,
        canInvite: true,
        canDelete: false,
        canPublish: false,
      };
    case 'reviewer':
      return {
        canEdit: false,
        canReview: true,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      };
    case 'viewer':
      return {
        canEdit: false,
        canReview: false,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      };
    default:
      return {
        canEdit: false,
        canReview: false,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      };
  }
};

// Role hierarchy utilities
export const getRoleHierarchy = (role: CollaboratorRole): number => {
  switch (role) {
    case 'owner': return 4;
    case 'editor': return 3;
    case 'reviewer': return 2;
    case 'viewer': return 1;
    default: return 0;
  }
};

export const canManageRole = (managerRole: CollaboratorRole, targetRole: CollaboratorRole): boolean => {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidRole = (role: string): role is CollaboratorRole => {
  return ['owner', 'editor', 'reviewer', 'viewer'].includes(role);
};

// Permission checking utilities
export const hasPermission = (
  collaborator: BookCollaborator | null,
  permission: keyof CollaboratorPermissions
): boolean => {
  if (!collaborator) return false;
  if (!collaborator.permissions) return false;
  return collaborator.permissions[permission] || false;
};

export const canAccessBook = (collaborator: BookCollaborator | null): boolean => {
  return collaborator !== null;
};

export const canEditBook = (collaborator: BookCollaborator | null): boolean => {
  return hasPermission(collaborator, 'canEdit');
};

export const canInviteToBook = (collaborator: BookCollaborator | null): boolean => {
  return hasPermission(collaborator, 'canInvite');
};

export const canDeleteFromBook = (collaborator: BookCollaborator | null): boolean => {
  return hasPermission(collaborator, 'canDelete');
};

// Display utilities
export const formatUserName = (user: { email: string; display_name?: string } | undefined): string => {
  if (!user) return 'Unknown User';
  return user.display_name || user.email.split('@')[0];
};

export const formatRole = (role: CollaboratorRole): string => {
  switch (role) {
    case 'owner': return 'Владелец';
    case 'editor': return 'Редактор';
    case 'reviewer': return 'Рецензент';
    case 'viewer': return 'Читатель';
    default: return role;
  }
};

export const formatRoleDescription = (role: CollaboratorRole): string => {
  switch (role) {
    case 'owner': return 'Полный доступ ко всем функциям';
    case 'editor': return 'Может редактировать и приглашать других';
    case 'reviewer': return 'Может оставлять комментарии и предложения';
    case 'viewer': return 'Только просмотр книги';
    default: return '';
  }
};

export const getAvatarColor = (userId: string): string => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  
  // Generate a consistent color based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Role configuration
export const ROLE_CONFIGS = {
  owner: {
    label: 'Владелец',
    description: 'Полный доступ ко всем функциям',
    icon: Crown,
    color: 'destructive' as const,
  },
  editor: {
    label: 'Редактор', 
    description: 'Может редактировать и приглашать других',
    icon: Edit,
    color: 'default' as const,
  },
  reviewer: {
    label: 'Рецензент',
    description: 'Может оставлять комментарии и предложения', 
    icon: Eye,
    color: 'secondary' as const,
  },
  viewer: {
    label: 'Читатель',
    description: 'Только просмотр книги',
    icon: EyeOff,
    color: 'outline' as const,
  }
};

// User display utilities
export const getUserDisplayName = (user: { email: string; display_name?: string } | undefined): string => {
  if (!user) return 'Unknown User';
  return user.display_name || user.email.split('@')[0];
};

export const getUserInitials = (user: { email: string; display_name?: string } | undefined): string => {
  if (!user) return '?';
  const name = user.display_name || user.email.split('@')[0];
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Collaboration management utilities
export const sortCollaborators = (collaborators: BookCollaborator[]): BookCollaborator[] => {
  return [...collaborators].sort((a, b) => {
    // Sort by role hierarchy first
    const roleA = getRoleHierarchy(a.role);
    const roleB = getRoleHierarchy(b.role);
    if (roleA !== roleB) return roleB - roleA;
    
    // Then by name
    const nameA = getUserDisplayName(a.user);
    const nameB = getUserDisplayName(b.user);
    return nameA.localeCompare(nameB);
  });
};

export const getAssignableRoles = (currentUserRole: CollaboratorRole): CollaboratorRole[] => {
  const allRoles: CollaboratorRole[] = ['owner', 'editor', 'reviewer', 'viewer'];
  return allRoles.filter(role => canManageRole(currentUserRole, role));
};

export const canManageCollaborator = (
  managerRole: CollaboratorRole,
  targetRole: CollaboratorRole
): boolean => {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
};

export const canChangeRole = (
  currentUserRole: CollaboratorRole,
  targetRole: CollaboratorRole,
  newRole: CollaboratorRole
): boolean => {
  // Can't change own role
  if (currentUserRole === targetRole) return false;
  
  // Must be able to manage both current and new role
  return canManageRole(currentUserRole, targetRole) && canManageRole(currentUserRole, newRole);
};