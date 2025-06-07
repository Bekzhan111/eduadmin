'use client';

import React, { useState } from 'react';
import { BookSearch, BookSearchResult } from '@/components/ui/book-search';
import { Button } from '@/components/ui/button';
import { 
  Search, Filter, TrendingUp, Eye, 
  ArrowLeft, Settings, Database, Zap,
  Target, BarChart3, Star
} from 'lucide-react';

export default function TestSearchPage() {
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const searchStats = {
    totalQueries: 15847,
    totalResults: 4567,
    avgResponseTime: 0.12,
    popularQueries: ['JavaScript', 'Python', 'React', 'ML', 'UX/UI']
  };

  const handleBookSelect = (book: BookSearchResult) => {
    setSelectedBook(book);
    console.log('Selected book:', book);
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
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Система поиска и фильтрации</h1>
                  <p className="text-sm text-gray-600">Интеллектуальный поиск книг с расширенными фильтрами</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-4 bg-gray-100 rounded-lg px-4 py-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{searchStats.totalQueries.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">запросов</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{searchStats.avgResponseTime}с</div>
                  <div className="text-xs text-gray-500">ответ</div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="text-gray-600">
                <Settings className="h-4 w-4 mr-2" />
                Настройки поиска
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
              {/* Search Statistics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Статистика поиска</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Всего книг в базе</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">12,567</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Просмотров за день</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">3,456</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Точность поиска</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">94.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Скорость поиска</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">120мс</span>
                  </div>
                </div>
              </div>

              {/* Popular Queries */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Популярные запросы</h3>
                
                <div className="space-y-3">
                  {searchStats.popularQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <span className="text-sm text-gray-900">{query}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">+{Math.floor(Math.random() * 20 + 5)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Возможности поиска</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Полнотекстовый поиск</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Фильтрация по категориям</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Поиск по автору</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Фильтр по рейтингу</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Ценовые диапазоны</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Фильтр по сложности</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Формат файлов</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Языковые фильтры</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Сортировка результатов</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Режимы отображения</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">История поиска</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Закладки и избранное</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Производительность</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Время отклика</span>
                      <span className="text-green-600 font-medium">Отлично</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Релевантность</span>
                      <span className="text-blue-600 font-medium">94.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Покрытие базы</span>
                      <span className="text-purple-600 font-medium">98.7%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                    </div>
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
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Демонстрация системы поиска
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Протестируйте мощную систему поиска с расширенными фильтрами. 
                    Попробуйте различные запросы и комбинации фильтров для поиска книг.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Search className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Умный поиск</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Поиск по названию, автору, описанию и тегам
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Filter className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Фильтры</span>
                      </div>
                      <p className="text-xs text-green-700">
                        12+ критериев фильтрации
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Сортировка</span>
                      </div>
                      <p className="text-xs text-purple-700">
                        6 способов сортировки результатов
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Попробуйте поискать:</span>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors">
                      &quot;JavaScript&quot;
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors">
                      &quot;Дизайн&quot;
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors">
                      &quot;Machine Learning&quot;
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors">
                      &quot;React&quot;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Component */}
            <BookSearch
              onResultSelect={handleBookSelect}
              className="mb-8"
            />

            {/* Selected Book Details */}
            {selectedBook && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Выбранная книга</h3>
                
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    {selectedBook.title.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedBook.title}
                    </h4>
                    <p className="text-gray-600 mb-3">
                      Автор: <span className="font-medium">{selectedBook.author}</span>
                    </p>
                    <p className="text-gray-700 mb-4">
                      {selectedBook.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Категория:</span>
                        <div className="font-medium text-gray-900">{selectedBook.category}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Рейтинг:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium text-gray-900">{selectedBook.rating}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Просмотры:</span>
                        <div className="font-medium text-gray-900">{selectedBook.views.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Цена:</span>
                        <div className="font-medium text-blue-600">
                          {selectedBook.price === 0 ? 'Бесплатно' : `${selectedBook.price} ₽`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-sm text-gray-500 mr-2">Теги:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedBook.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {selectedBook.isFree ? 'Читать книгу' : 'Купить книгу'}
                  </Button>
                  <Button variant="outline">
                    Добавить в закладки
                  </Button>
                  <Button variant="outline">
                    Поделиться
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 