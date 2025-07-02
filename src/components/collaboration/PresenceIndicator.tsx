import React from 'react';
import { UserPresence } from '@/components/book-editor/types';
import { formatUserName, getAvatarColor } from '@/utils/collaboration';
import { Eye, Edit3, MessageSquare } from 'lucide-react';

interface PresenceIndicatorProps {
  presence: UserPresence[];
  currentUserId?: string;
  className?: string;
  showDetails?: boolean;
  maxVisible?: number;
}

const ACTIVITY_ICONS = {
  viewing: Eye,
  editing: Edit3,
  commenting: MessageSquare,
};

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  presence,
  currentUserId,
  className = "",
  showDetails = false,
  maxVisible = 5
}) => {
  // Safety check for presence array
  if (!Array.isArray(presence)) {
    return null;
  }

  // Filter out current user and only show online users
  const otherUsers = presence.filter(p => {
    try {
      return p && 
        p.user_id !== currentUserId && 
        p.is_online &&
        p.last_seen &&
        new Date(p.last_seen) > new Date(Date.now() - 5 * 60 * 1000); // Active in last 5 minutes
    } catch (error) {
      console.warn('Error filtering presence:', error, p);
      return false;
    }
  });

  if (otherUsers.length === 0) {
    return null;
  }

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex -space-x-2">
        {visibleUsers.map((userPresence) => {
          const userName = formatUserName(userPresence.user);
          const avatarColor = getAvatarColor(userPresence.user_id);
          const isRecent = new Date(userPresence.last_seen) > new Date(Date.now() - 60 * 1000); // Active in last minute
          
          return (
            <div
              key={userPresence.user_id}
              className="relative group"
              title={`${userName} ${isRecent ? '(активен)' : '(был активен недавно)'}`}
            >
              <div 
                className={`
                  w-8 h-8 rounded-full border-2 border-white flex items-center justify-center 
                  text-white font-medium text-sm relative transition-all duration-200
                  ${isRecent ? 'ring-2 ring-green-400' : ''}
                `}
                style={{ backgroundColor: avatarColor }}
              >
                {userName.charAt(0).toUpperCase()}
                
                {/* Online indicator */}
                <div 
                  className={`
                    absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                    ${isRecent ? 'bg-green-400' : 'bg-gray-400'}
                  `}
                />
              </div>

              {/* Tooltip with details */}
              {showDetails && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    <div className="font-medium">{userName}</div>
                    {userPresence.current_section && (
                      <div className="text-gray-300">
                        Раздел: {userPresence.current_section}
                      </div>
                    )}
                    <div className="text-gray-400">
                      {isRecent ? 'Активен сейчас' : 'Был активен недавно'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show count of hidden users */}
        {hiddenCount > 0 && (
          <div 
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white font-medium text-xs"
            title={`Еще ${hiddenCount} пользователь${hiddenCount > 1 ? (hiddenCount > 4 ? 'ей' : 'я') : ''} онлайн`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Online count text */}
      {otherUsers.length > 0 && (
        <span className="text-sm text-gray-500 ml-2">
          {otherUsers.length === 1 
            ? '1 пользователь онлайн' 
            : `${otherUsers.length} пользователей онлайн`
          }
        </span>
      )}
    </div>
  );
};

// Component for showing presence in a specific section
interface SectionPresenceProps {
  presence: UserPresence[];
  sectionId: string;
  currentUserId?: string;
  className?: string;
}

export const SectionPresence: React.FC<SectionPresenceProps> = ({
  presence,
  sectionId,
  currentUserId,
  className = ""
}) => {
  const sectionUsers = presence.filter(p => 
    p.user_id !== currentUserId && 
    p.is_online &&
    p.current_section === sectionId &&
    new Date(p.last_seen) > new Date(Date.now() - 2 * 60 * 1000) // Active in last 2 minutes
  );

  if (sectionUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex -space-x-1">
        {sectionUsers.slice(0, 3).map((userPresence) => {
          const userName = formatUserName(userPresence.user);
          const avatarColor = getAvatarColor(userPresence.user_id);
          
          return (
            <div
              key={userPresence.user_id}
              className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-white font-medium text-xs"
              style={{ backgroundColor: avatarColor }}
              title={`${userName} просматривает этот раздел`}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          );
        })}
        
        {sectionUsers.length > 3 && (
          <div 
            className="w-6 h-6 rounded-full border border-white bg-gray-500 flex items-center justify-center text-white font-medium text-xs"
            title={`Еще ${sectionUsers.length - 3} пользователей в этом разделе`}
          >
            +{sectionUsers.length - 3}
          </div>
        )}
      </div>
      
      <span className="text-xs text-gray-500">
        {sectionUsers.length === 1 ? 'здесь' : 'здесь'}
      </span>
    </div>
  );
};