import React from 'react';
import { Button } from '@/components/ui/button';
import { EditingSession } from '@/components/book-editor/types';
import { formatUserName, getAvatarColor } from '@/utils/collaboration';
import { Lock, Clock, AlertTriangle, X } from 'lucide-react';

interface EditingLockIndicatorProps {
  session: EditingSession;
  canOverride?: boolean;
  onOverride?: () => void;
  className?: string;
  compact?: boolean;
}

export const EditingLockIndicator: React.FC<EditingLockIndicatorProps> = ({
  session,
  canOverride = false,
  onOverride,
  className = "",
  compact = false
}) => {
  // Safety check for session object
  if (!session || !session.user_id || !session.locked_at || !session.last_activity) {
    console.warn('Invalid editing session object:', session);
    return null;
  }

  const userName = formatUserName(session.user);
  const avatarColor = getAvatarColor(session.user_id);
  
  let timeSinceLocked: number;
  let lastActivity: number;
  
  try {
    timeSinceLocked = Date.now() - new Date(session.locked_at).getTime();
    lastActivity = Date.now() - new Date(session.last_activity).getTime();
  } catch (error) {
    console.warn('Error parsing session dates:', error, session);
    return null;
  }
  
  // Determine if session is stale (no activity for more than 10 minutes)
  const isStale = lastActivity > 10 * 60 * 1000;
  
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ч ${minutes % 60} мин назад`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: avatarColor }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <Lock className="w-3 h-3 text-orange-500" />
          {isStale && <AlertTriangle className="w-3 h-3 text-red-500" />}
        </div>
        
        {canOverride && onOverride && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOverride}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-800"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 bg-yellow-50 border-yellow-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-gray-900">
                Редактируется пользователем {userName}
              </span>
              {isStale && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Неактивен</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Заблокировано {formatTime(timeSinceLocked)}</span>
              </div>
              
              {!isStale && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Активность {formatTime(lastActivity)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {canOverride && onOverride && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOverride}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            {isStale ? 'Разблокировать' : 'Принудительно разблокировать'}
          </Button>
        )}
      </div>

      {session.section_type && (
        <div className="mt-2 text-xs text-gray-500">
          Тип раздела: {session.section_type === 'page' ? 'Страница' : 
                       session.section_type === 'element' ? 'Элемент' : 
                       session.section_type === 'chapter' ? 'Глава' : session.section_type}
        </div>
      )}
    </div>
  );
};

// Component for showing a small lock overlay on elements
interface ElementLockOverlayProps {
  session: EditingSession;
  className?: string;
}

export const ElementLockOverlay: React.FC<ElementLockOverlayProps> = ({
  session,
  className = ""
}) => {
  const userName = formatUserName(session.user);
  const avatarColor = getAvatarColor(session.user_id);
  
  return (
    <div className={`absolute inset-0 bg-yellow-100 bg-opacity-80 border-2 border-yellow-400 rounded flex items-center justify-center z-10 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: avatarColor }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex items-center gap-1">
          <Lock className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-900">
            Редактируется
          </span>
        </div>
      </div>
    </div>
  );
};