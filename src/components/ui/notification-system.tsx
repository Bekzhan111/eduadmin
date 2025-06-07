'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bell, BellRing, MessageCircle, Star, Heart, BookOpen, 
  Users, TrendingUp, Award, AlertCircle, CheckCircle, 
  X, Settings, Filter, Search, Calendar, Clock,
  Mail, Smartphone, Monitor, Volume2, VolumeX,
  Eye, EyeOff, Trash2, Archive, MoreHorizontal
} from 'lucide-react';

// Types
export interface Notification {
  id: string;
  type: 'comment' | 'rating' | 'like' | 'follow' | 'book_update' | 'system' | 'achievement' | 'reminder';
  title: string;
  message: string;
  userId: string;
  bookId?: string;
  bookTitle?: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  email: {
    comments: boolean;
    ratings: boolean;
    likes: boolean;
    follows: boolean;
    bookUpdates: boolean;
    system: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  push: {
    comments: boolean;
    ratings: boolean;
    likes: boolean;
    follows: boolean;
    bookUpdates: boolean;
    system: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  inApp: {
    comments: boolean;
    ratings: boolean;
    likes: boolean;
    follows: boolean;
    bookUpdates: boolean;
    system: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationSystemProps {
  userId: string;
  className?: string;
}

export function NotificationSystem({ userId, className = '' }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      comments: true,
      ratings: true,
      likes: false,
      follows: true,
      bookUpdates: true,
      system: true,
      achievements: true,
      reminders: true,
    },
    push: {
      comments: true,
      ratings: false,
      likes: false,
      follows: true,
      bookUpdates: true,
      system: true,
      achievements: false,
      reminders: true,
    },
    inApp: {
      comments: true,
      ratings: true,
      likes: true,
      follows: true,
      bookUpdates: true,
      system: true,
      achievements: true,
      reminders: true,
    },
    frequency: 'instant',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'comment',
        title: 'Новый комментарий',
        message: 'Анна Петрова оставила комментарий к вашей книге "Основы программирования"',
        userId,
        bookId: 'book-1',
        bookTitle: 'Основы программирования',
        fromUserId: 'user-1',
        fromUserName: 'Анна Петрова',
        fromUserAvatar: '/avatars/anna.jpg',
        createdAt: '2024-01-15T10:30:00Z',
        isRead: false,
        priority: 'medium',
        actionUrl: '/books/book-1#comments',
        actionText: 'Посмотреть комментарий'
      },
      {
        id: '2',
        type: 'rating',
        title: 'Новая оценка',
        message: 'Михаил Иванов поставил 5 звезд вашей книге "Дизайн-мышление"',
        userId,
        bookId: 'book-2',
        bookTitle: 'Дизайн-мышление',
        fromUserId: 'user-2',
        fromUserName: 'Михаил Иванов',
        createdAt: '2024-01-15T09:15:00Z',
        isRead: false,
        priority: 'low',
        actionUrl: '/books/book-2',
        actionText: 'Посмотреть книгу'
      },
      {
        id: '3',
        type: 'follow',
        title: 'Новый подписчик',
        message: 'Елена Сидорова подписалась на ваши обновления',
        userId,
        fromUserId: 'user-3',
        fromUserName: 'Елена Сидорова',
        createdAt: '2024-01-14T16:45:00Z',
        isRead: true,
        priority: 'medium',
        actionUrl: '/profile/user-3',
        actionText: 'Посмотреть профиль'
      },
      {
        id: '4',
        type: 'achievement',
        title: 'Достижение разблокировано!',
        message: 'Вы получили значок "Популярный автор" за 100 лайков',
        userId,
        createdAt: '2024-01-14T14:20:00Z',
        isRead: true,
        priority: 'high',
        actionUrl: '/profile/achievements',
        actionText: 'Посмотреть достижения'
      },
      {
        id: '5',
        type: 'book_update',
        title: 'Обновление книги',
        message: 'Дмитрий Козлов обновил книгу "React для начинающих"',
        userId,
        bookId: 'book-3',
        bookTitle: 'React для начинающих',
        fromUserId: 'user-4',
        fromUserName: 'Дмитрий Козлов',
        createdAt: '2024-01-13T11:30:00Z',
        isRead: false,
        priority: 'medium',
        actionUrl: '/books/book-3',
        actionText: 'Посмотреть обновления'
      },
      {
        id: '6',
        type: 'system',
        title: 'Системное уведомление',
        message: 'Запланированное техническое обслуживание 16 января с 02:00 до 04:00',
        userId,
        createdAt: '2024-01-13T09:00:00Z',
        isRead: false,
        priority: 'urgent',
        actionUrl: '/system/maintenance',
        actionText: 'Подробнее'
      },
      {
        id: '7',
        type: 'reminder',
        title: 'Напоминание',
        message: 'Не забудьте обновить свою книгу "Веб-разработка". Последнее обновление было 2 недели назад',
        userId,
        bookId: 'book-4',
        bookTitle: 'Веб-разработка',
        createdAt: '2024-01-12T10:00:00Z',
        isRead: true,
        priority: 'low',
        actionUrl: '/books/book-4/edit',
        actionText: 'Редактировать книгу'
      }
    ];

    setNotifications(mockNotifications);
  }, [userId]);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
      priority === 'urgent' ? 'text-red-600' :
      priority === 'high' ? 'text-orange-600' :
      priority === 'medium' ? 'text-blue-600' :
      'text-gray-600'
    }`;

    switch (type) {
      case 'comment':
        return <MessageCircle className={iconClass} />;
      case 'rating':
        return <Star className={iconClass} />;
      case 'like':
        return <Heart className={iconClass} />;
      case 'follow':
        return <Users className={iconClass} />;
      case 'book_update':
        return <BookOpen className={iconClass} />;
      case 'achievement':
        return <Award className={iconClass} />;
      case 'system':
        return <AlertCircle className={iconClass} />;
      case 'reminder':
        return <Clock className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'только что';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч. назад`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
        : notification
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      isRead: true,
      readAt: new Date().toISOString()
    })));
  };

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const handleDeleteAll = () => {
    if (confirm('Вы уверены, что хотите удалить все уведомления?')) {
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    // Filter by search query
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const updateSettings = (category: keyof NotificationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, any>),
        [key]: value
      }
    }));
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Уведомления</h3>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Прочитать все
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-600 hover:text-gray-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">Все</option>
              <option value="unread">Непрочитанные</option>
              <option value="read">Прочитанные</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">Все типы</option>
            <option value="comment">Комментарии</option>
            <option value="rating">Оценки</option>
            <option value="like">Лайки</option>
            <option value="follow">Подписки</option>
            <option value="book_update">Обновления книг</option>
            <option value="achievement">Достижения</option>
            <option value="system">Системные</option>
            <option value="reminder">Напоминания</option>
          </select>

          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск уведомлений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Очистить все
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Настройки уведомлений</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <h5 className="font-medium text-gray-900">Email</h5>
              </div>
              <div className="space-y-2">
                {Object.entries(settings.email).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateSettings('email', key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Push Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Smartphone className="h-4 w-4 text-green-600" />
                <h5 className="font-medium text-gray-900">Push</h5>
              </div>
              <div className="space-y-2">
                {Object.entries(settings.push).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateSettings('push', key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* In-App Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Monitor className="h-4 w-4 text-purple-600" />
                <h5 className="font-medium text-gray-900">В приложении</h5>
              </div>
              <div className="space-y-2">
                {Object.entries(settings.inApp).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateSettings('inApp', key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Частота уведомлений
                </Label>
                <select
                  value={settings.frequency}
                  onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="instant">Мгновенно</option>
                  <option value="hourly">Каждый час</option>
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Тихие часы
                </Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.quietHours.enabled}
                      onChange={(e) => updateSettings('quietHours', 'enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Включить тихие часы</span>
                  </label>
                  {settings.quietHours.enabled && (
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => updateSettings('quietHours', 'start', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-gray-500 self-center">до</span>
                      <input
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => updateSettings('quietHours', 'end', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уведомлений</h3>
            <p className="text-gray-600">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'У вас пока нет уведомлений'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  notification.isRead ? 'opacity-75' : ''
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                          {notification.bookTitle && (
                            <div className="flex items-center space-x-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{notification.bookTitle}</span>
                            </div>
                          )}
                          {notification.fromUserName && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{notification.fromUserName}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {notification.actionUrl && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                            >
                              {notification.actionText || 'Перейти'}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-gray-400 hover:text-blue-600"
                            title="Отметить как прочитанное"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Удалить уведомление"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Показано {filteredNotifications.length} из {notifications.length} уведомлений</span>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              Загрузить еще
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 