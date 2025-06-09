'use client';

import { useState } from 'react';
import { BookCollaborators, BookCollaborator, CollaboratorRole } from '@/components/ui/book-collaborators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Activity, MessageSquare, Clock } from 'lucide-react';

// Types
interface Collaborator {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  avatar: string;
  lastActive: string;
  permissions: string[];
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function TestCollaborationPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'collab1',
      user_id: 'user1',
      book_id: 'book123',
      role: 'owner',
      permissions: {
        canEdit: true,
        canReview: true,
        canInvite: true,
        canDelete: true,
        canPublish: true,
      },
      status: 'accepted',
      invited_at: '2024-01-01T00:00:00Z',
      accepted_at: '2024-01-01T00:00:00Z',
      invited_by: 'user1',
      user: {
        id: 'user1',
        email: 'owner@example.com',
        display_name: 'Главный Автор',
      }
    },
    {
      id: 'collab2',
      user_id: 'user2',
      book_id: 'book123',
      role: 'editor',
      permissions: {
        canEdit: true,
        canReview: true,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      },
      status: 'accepted',
      invited_at: '2024-01-02T00:00:00Z',
      accepted_at: '2024-01-02T12:00:00Z',
      invited_by: 'user1',
      user: {
        id: 'user2',
        email: 'editor@example.com',
        display_name: 'Редактор Иван',
      }
    },
    {
      id: 'collab3',
      user_id: 'user3',
      book_id: 'book123',
      role: 'reviewer',
      permissions: {
        canEdit: false,
        canReview: true,
        canInvite: false,
        canDelete: false,
        canPublish: false,
      },
      status: 'pending',
      invited_at: '2024-01-03T00:00:00Z',
      invited_by: 'user1',
      user: {
        id: 'user3',
        email: 'reviewer@example.com',
        display_name: 'Рецензент Мария',
      }
    }
  ]);

  const [activityLog, _setActivityLog] = useState([
    {
      id: 1,
      user: 'Редактор Иван',
      action: 'отредактировал главу "Введение"',
      timestamp: '2024-01-15 14:30',
      type: 'edit'
    },
    {
      id: 2,
      user: 'Рецензент Мария',
      action: 'оставил комментарий к разделу 2.1',
      timestamp: '2024-01-15 13:45',
      type: 'comment'
    },
    {
      id: 3,
      user: 'Главный Автор',
      action: 'пригласил нового соавтора',
      timestamp: '2024-01-15 12:00',
      type: 'invite'
    },
    {
      id: 4,
      user: 'Редактор Иван',
      action: 'принял приглашение к сотрудничеству',
      timestamp: '2024-01-14 16:20',
      type: 'accept'
    }
  ]);

  const currentUserId = 'user1'; // Simulate current user as owner
  const bookId = 'book123';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'invite':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'accept':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'edit':
        return <Badge variant="outline" className="text-blue-600">Редактирование</Badge>;
      case 'comment':
        return <Badge variant="outline" className="text-green-600">Комментарий</Badge>;
      case 'invite':
        return <Badge variant="outline" className="text-purple-600">Приглашение</Badge>;
      case 'accept':
        return <Badge variant="outline" className="text-orange-600">Принятие</Badge>;
      default:
        return <Badge variant="outline">Действие</Badge>;
    }
  };

  const collaborationStats = {
    totalCollaborators: collaborators.length,
    activeCollaborators: collaborators.filter(c => c.status === 'accepted').length,
    pendingInvites: collaborators.filter(c => c.status === 'pending').length,
    totalEdits: 47,
    totalComments: 23,
    lastActivity: '2024-01-15 14:30'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Тест Мультиавторства</h1>
        <p className="text-gray-600">
          Проверка системы совместной работы над книгами с различными ролями и правами доступа
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего Соавторов</p>
                <p className="text-2xl font-bold">{collaborationStats.totalCollaborators}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активные</p>
                <p className="text-2xl font-bold">{collaborationStats.activeCollaborators}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают</p>
                <p className="text-2xl font-bold">{collaborationStats.pendingInvites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего Правок</p>
                <p className="text-2xl font-bold">{collaborationStats.totalEdits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collaborators Management */}
        <div className="lg:col-span-2">
          <BookCollaborators
            bookId={bookId}
            currentUserId={currentUserId}
            collaborators={collaborators}
            onCollaboratorsChange={setCollaborators}
            isOwner={true}
          />
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Лента Активности
              </CardTitle>
              <CardDescription>
                Последние действия соавторов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-gray-600">{activity.action}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">{activity.timestamp}</div>
                        {getActivityBadge(activity.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Показать Больше
              </Button>
            </CardContent>
          </Card>

          {/* Collaboration Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Рабочий Процесс</CardTitle>
              <CardDescription>
                Этапы совместной работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Приглашение</div>
                    <div className="text-sm text-gray-500">Владелец приглашает соавторов</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Принятие</div>
                    <div className="text-sm text-gray-500">Соавторы принимают приглашения</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Совместная Работа</div>
                    <div className="text-sm text-gray-500">Редактирование и рецензирование</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-medium">Публикация</div>
                    <div className="text-sm text-gray-500">Финальная проверка и публикация</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Пригласить Соавтора
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Оставить Комментарий
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Просмотреть Изменения
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                История Версий
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 