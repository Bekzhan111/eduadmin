'use client';

import React, { useState } from 'react';
import { NotificationSystem } from '@/components/ui/notification-system';
import { Button } from '@/components/ui/button';
import { 
  Bell, BellRing, MessageCircle, Star, Users, 
  BookOpen, ArrowLeft, Settings, Zap, Target,
  TrendingUp, Award, AlertCircle, Clock
} from 'lucide-react';

export default function TestNotificationsPage() {
  const [userId] = useState('test-user-123');
  const [simulationMode, setSimulationMode] = useState(false);

  const notificationTypes = [
    {
      type: 'comment',
      icon: MessageCircle,
      label: 'Комментарии',
      description: 'Новые комментарии к вашим книгам',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      type: 'rating',
      icon: Star,
      label: 'Оценки',
      description: 'Новые оценки ваших книг',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      type: 'follow',
      icon: Users,
      label: 'Подписки',
      description: 'Новые подписчики',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      type: 'book_update',
      icon: BookOpen,
      label: 'Обновления книг',
      description: 'Обновления от авторов, на которых вы подписаны',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      type: 'achievement',
      icon: Award,
      label: 'Достижения',
      description: 'Разблокированные достижения и награды',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      type: 'system',
      icon: AlertCircle,
      label: 'Системные',
      description: 'Важные системные уведомления',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      type: 'reminder',
      icon: Clock,
      label: 'Напоминания',
      description: 'Напоминания о важных действиях',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  const simulateNotification = (type: string) => {
    // This would normally trigger a real notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-medium">Уведомление отправлено!</h4>
          <p class="text-sm opacity-90 mt-1">Симуляция уведомления типа "${type}"</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к панели
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    3
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Система уведомлений</h1>
                  <p className="text-sm text-gray-600">Тестирование и настройка уведомлений</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <span className="text-sm text-gray-600">Симуляция:</span>
                <Button
                  variant={simulationMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSimulationMode(!simulationMode)}
                  className="text-xs"
                >
                  {simulationMode ? 'Включена' : 'Выключена'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Типы уведомлений</h3>
              
              <div className="space-y-3">
                {notificationTypes.map((notificationType) => (
                  <div
                    key={notificationType.type}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 ${notificationType.bgColor} rounded-lg`}>
                        <notificationType.icon className={`h-4 w-4 ${notificationType.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {notificationType.label}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notificationType.description}
                        </p>
                        {simulationMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => simulateNotification(notificationType.type)}
                            className="mt-2 text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Тест
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Статистика</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Всего уведомлений</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BellRing className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Непрочитанных</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">За сегодня</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Важных</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600">1</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Возможности</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Email уведомления</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Push уведомления</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Уведомления в приложении</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Настройка частоты</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Тихие часы</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Фильтрация и поиск</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Приоритеты уведомлений</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Групповые действия</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Уведомления</h3>
                    <p className="text-sm text-gray-600">Центр управления</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Мгновенные уведомления о важных событиях</p>
                  <p>• Настраиваемые типы и частота</p>
                  <p>• Поддержка множественных каналов</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Настройки</h3>
                    <p className="text-sm text-gray-600">Персонализация</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Гибкие настройки для каждого типа</p>
                  <p>• Тихие часы и частота доставки</p>
                  <p>• Фильтрация по важности</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Аналитика</h3>
                    <p className="text-sm text-gray-600">Статистика</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Отслеживание активности</p>
                  <p>• Статистика прочтений</p>
                  <p>• Оптимизация доставки</p>
                </div>
              </div>
            </div>

            {/* Notification System Component */}
            <NotificationSystem userId={userId} />

            {/* Additional Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Приоритеты</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <span className="font-medium text-red-600">Срочные</span>
                      <p className="text-sm text-gray-600">Критические системные уведомления</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <span className="font-medium text-orange-600">Высокие</span>
                      <p className="text-sm text-gray-600">Важные достижения и события</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <span className="font-medium text-blue-600">Средние</span>
                      <p className="text-sm text-gray-600">Обычные уведомления</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                      <span className="font-medium text-gray-600">Низкие</span>
                      <p className="text-sm text-gray-600">Информационные сообщения</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Каналы доставки</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">В приложении</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">Активно</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Email</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">Активно</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BellRing className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-700">Push</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600">Частично</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-gray-700">SMS</span>
                    </div>
                    <span className="text-sm font-medium text-gray-500">Отключено</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 