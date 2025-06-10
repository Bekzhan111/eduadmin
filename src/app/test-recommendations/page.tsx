'use client';

import React, { useState } from 'react';
import { BookRecommendations } from '@/components/ui/book-recommendations';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, Target, Brain, Users, TrendingUp,
  ArrowLeft, Settings, Sparkles, Eye, Star,
  BarChart3, Zap, Award, Globe
} from 'lucide-react';

export default function TestRecommendationsPage() {
  const [selectedUserId, setSelectedUserId] = useState('user-1');
  const [maxRecommendations, setMaxRecommendations] = useState(12);
  const [showEngineSelector, setShowEngineSelector] = useState(true);

  const mockUsers = [
    {
      id: 'user-1',
      name: 'Александр Иванов',
      preferences: 'Программирование, ИИ, Frontend',
      readingLevel: 'Продвинутый',
      booksRead: 23,
      averageRating: 4.3
    },
    {
      id: 'user-2',
      name: 'Мария Петрова',
      preferences: 'UX/UI, Дизайн, Психология',
      readingLevel: 'Средний',
      booksRead: 15,
      averageRating: 4.7
    },
    {
      id: 'user-3',
      name: 'Дмитрий Сидоров',
      preferences: 'Backend, Архитектура, DevOps',
      readingLevel: 'Эксперт',
      booksRead: 34,
      averageRating: 4.1
    }
  ];

  const _algorithmStats = {
    collaborative: { accuracy: 87.8, users: 12500, recommendations: 156000 },
    content_based: { accuracy: 84.5, books: 8900, features: 45 },
    hybrid: { accuracy: 92.3, precision: 89.1, recall: 86.4 },
    personalized: { accuracy: 89.1, userProfiles: 11200, interactions: 780000 },
    trending: { accuracy: 76.2, views: 2300000, timeWindow: '7d' }
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
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Система рекомендаций</h1>
                  <p className="text-sm text-gray-600">Интеллектуальные персональные рекомендации книг</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-4 bg-gray-100 rounded-lg px-4 py-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">92.3%</div>
                  <div className="text-xs text-gray-500">точность</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">156K</div>
                  <div className="text-xs text-gray-500">рекомендаций</div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="text-gray-600">
                <Settings className="h-4 w-4 mr-2" />
                Настройки ML
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* User Selector */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Тестовые пользователи</h3>
                
                <div className="space-y-3">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedUserId === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {user.name}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {user.preferences}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{user.booksRead} книг</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span>{user.averageRating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Algorithm Performance */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Производительность алгоритмов</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Гибридный</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600">92.3%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Коллаборативный</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">87.8%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Персональный</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">89.1%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Контентный</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600">84.5%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-gray-600">Популярные</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">76.2%</span>
                  </div>
                </div>
              </div>

              {/* System Metrics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Метрики системы</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Активных пользователей</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">12,567</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Время отклика</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">45мс</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">CTR рекомендаций</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">23.4%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Покрытие каталога</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">89.7%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Возможности системы</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">5 алгоритмов рекомендаций</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Персональные профили</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Объяснения рекомендаций</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Оценка уверенности</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Фильтрация и сортировка</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Реальное время</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">A/B тестирование</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Холодный старт</span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Настройки тестирования</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Количество рекомендаций
                    </label>
                    <select
                      value={maxRecommendations}
                      onChange={(e) => setMaxRecommendations(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value={6}>6 рекомендаций</option>
                      <option value={12}>12 рекомендаций</option>
                      <option value={18}>18 рекомендаций</option>
                      <option value={24}>24 рекомендации</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showEngineSelector"
                      checked={showEngineSelector}
                      onChange={(e) => setShowEngineSelector(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="showEngineSelector" className="text-sm text-gray-700">
                      Показать выбор алгоритма
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Demo Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Демонстрация системы рекомендаций
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Протестируйте интеллектуальную систему рекомендаций с различными алгоритмами машинного обучения.
                    Выберите пользователя и алгоритм для персонализированных рекомендаций.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">ИИ алгоритмы</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        5 различных алгоритмов ML
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Персонализация</span>
                      </div>
                      <p className="text-xs text-green-700">
                        Учет предпочтений пользователя
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Объяснения</span>
                      </div>
                      <p className="text-xs text-purple-700">
                        Причины рекомендаций
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Точность</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        92.3% точность гибридного алгоритма
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Алгоритмы:</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Гибридный</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Коллаборативный</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Персональный</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Контентный</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Популярные</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Component */}
            <BookRecommendations
              userId={selectedUserId}
              maxRecommendations={maxRecommendations}
              showEngineSelector={showEngineSelector}
              className="mb-8"
            />

            {/* Algorithm Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Детали алгоритмов рекомендаций</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Гибридный алгоритм</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Комбинирует коллаборативную фильтрацию, контентный анализ и персональные предпочтения.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Точность: <span className="font-medium text-purple-600">92.3%</span></div>
                    <div>Precision: <span className="font-medium">89.1%</span></div>
                    <div>Recall: <span className="font-medium">86.4%</span></div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Коллаборативная фильтрация</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Рекомендации на основе поведения похожих пользователей и их оценок.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Точность: <span className="font-medium text-blue-600">87.8%</span></div>
                    <div>Пользователей: <span className="font-medium">12,500</span></div>
                    <div>Рекомендаций: <span className="font-medium">156K</span></div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Target className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">Персональные рекомендации</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Анализ индивидуального профиля пользователя и истории взаимодействий.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Точность: <span className="font-medium text-green-600">89.1%</span></div>
                    <div>Профилей: <span className="font-medium">11,200</span></div>
                    <div>Взаимодействий: <span className="font-medium">780K</span></div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-gray-900">Контентные рекомендации</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Анализ характеристик книг: жанр, автор, теги, сложность, тематика.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Точность: <span className="font-medium text-orange-600">84.5%</span></div>
                    <div>Книг в базе: <span className="font-medium">8,900</span></div>
                    <div>Признаков: <span className="font-medium">45</span></div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-gray-900">Популярные книги</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Рекомендации на основе текущих трендов и популярности среди пользователей.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Точность: <span className="font-medium text-red-600">76.2%</span></div>
                    <div>Просмотров: <span className="font-medium">2.3M</span></div>
                    <div>Окно: <span className="font-medium">7 дней</span></div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium text-gray-900">ML Pipeline</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Автоматическое переобучение моделей, A/B тестирование, мониторинг качества.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Обновление: <span className="font-medium text-indigo-600">каждый час</span></div>
                    <div>Эксперименты: <span className="font-medium">12 активных</span></div>
                    <div>Метрики: <span className="font-medium">в реальном времени</span></div>
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