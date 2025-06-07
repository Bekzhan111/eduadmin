'use client';

import React, { useState } from 'react';
import { BookAnalytics } from '@/components/ui/book-analytics';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Users, Eye, 
  ArrowLeft, Filter, Download, RefreshCw,
  Calendar, Globe, Smartphone, Award
} from 'lucide-react';

export default function TestAnalyticsPage() {
  const [selectedBook, setSelectedBook] = useState('book-1');
  const [dateRange, setDateRange] = useState('30d');

  const mockBooks = [
    {
      id: 'book-1',
      title: 'Основы программирования на JavaScript',
      author: 'Иван Петров',
      description: 'Полное руководство по изучению JavaScript с нуля до профессионального уровня',
      category: 'Программирование'
    },
    {
      id: 'book-2', 
      title: 'Дизайн-мышление в UX/UI',
      author: 'Анна Сидорова',
      description: 'Практическое руководство по созданию пользовательских интерфейсов',
      category: 'Дизайн'
    },
    {
      id: 'book-3',
      title: 'Машинное обучение для начинающих',
      author: 'Дмитрий Козлов',
      description: 'Введение в мир искусственного интеллекта и анализа данных',
      category: 'ИИ и ML'
    }
  ];

  const selectedBookData = mockBooks.find(book => book.id === selectedBook);

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
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Аналитика и статистика</h1>
                  <p className="text-sm text-gray-600">Детальная аналитика книг и читательского поведения</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <span className="text-sm text-gray-600">Период:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="7d">7 дней</option>
                  <option value="30d">30 дней</option>
                  <option value="90d">3 месяца</option>
                  <option value="1y">1 год</option>
                </select>
              </div>

              <Button variant="outline" size="sm" className="text-gray-600">
                <Download className="h-4 w-4 mr-2" />
                Экспорт отчета
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Выберите книгу</h3>
              
              <div className="space-y-3">
                {mockBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedBook === book.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {book.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {book.author}
                        </p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {book.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Общая статистика</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Всего просмотров</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">45,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Уникальных читателей</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">12,567</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Рост за месяц</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+23.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Индекс качества</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">87.3</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Возможности аналитики</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Просмотры и уникальные посетители</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>География читателей</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Анализ устройств и браузеров</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Источники трафика</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Поведение читателей</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Экспорт данных в JSON</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Book Info */}
            {selectedBookData && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    {selectedBookData.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedBookData.title}
                        </h2>
                        <p className="text-gray-600 mb-3">
                          Автор: <span className="font-medium">{selectedBookData.author}</span>
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {selectedBookData.description}
                        </p>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {selectedBookData.category}
                        </span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">15,847</div>
                          <div className="text-sm text-gray-500">просмотров</div>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">+12.4%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Component */}
            {selectedBookData && (
              <BookAnalytics
                bookId={selectedBook}
                bookTitle={selectedBookData.title}
                dateRange={dateRange}
              />
            )}

            {/* Additional Insights */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Тенденции</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Рост просмотров за неделю</span>
                    <span className="text-green-600 font-medium">+8.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Прирост новых читателей</span>
                    <span className="text-green-600 font-medium">+15.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Время чтения увеличилось</span>
                    <span className="text-green-600 font-medium">+3.4мин</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Вовлеченность читателей</span>
                    <span className="text-blue-600 font-medium">78.5%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Глобальная статистика</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Страны присутствия</span>
                    <span className="text-gray-900 font-medium">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Языки интерфейса</span>
                    <span className="text-gray-900 font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Мобильный трафик</span>
                    <span className="text-gray-900 font-medium">60.0%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Социальные переходы</span>
                    <span className="text-gray-900 font-medium">20.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Рекомендации по улучшению</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Оптимизация для мобильных</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    60% читателей используют мобильные устройства. Рассмотрите адаптацию контента.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Социальные сети</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Высокий трафик из соцсетей. Увеличьте активность в социальных платформах.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Время чтения</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Среднее время чтения 42 минуты - отличный показатель вовлеченности читателей.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Международная аудитория</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Читатели из 47 стран. Рассмотрите локализацию для ключевых рынков.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 