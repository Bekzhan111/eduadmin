'use client';

import React, { useState } from 'react';
import { BookComments } from '@/components/ui/book-comments';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, Star, Users, TrendingUp, 
  ArrowLeft, Settings, Shield
} from 'lucide-react';

export default function TestCommentsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>('current-user');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const mockBooks = [
    {
      id: 'book-1',
      title: 'Основы программирования на JavaScript',
      author: 'Иван Петров',
      description: 'Полное руководство по изучению JavaScript с нуля до профессионального уровня'
    },
    {
      id: 'book-2', 
      title: 'Дизайн-мышление в UX/UI',
      author: 'Анна Сидорова',
      description: 'Практическое руководство по созданию пользовательских интерфейсов'
    }
  ];

  const [selectedBook, setSelectedBook] = useState(mockBooks[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к книгам
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Система комментариев</h1>
                  <p className="text-sm text-gray-600">Тестирование функций обратной связи</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <span className="text-sm text-gray-600">Режим:</span>
                <Button
                  variant={isReadOnly ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsReadOnly(false)}
                  className="text-xs"
                >
                  Интерактивный
                </Button>
                <Button
                  variant={isReadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsReadOnly(true)}
                  className="text-xs"
                >
                  Только чтение
                </Button>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <span className="text-sm text-gray-600">Пользователь:</span>
                <Button
                  variant={currentUserId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentUserId(currentUserId ? undefined : 'current-user')}
                  className="text-xs"
                >
                  {currentUserId ? 'Авторизован' : 'Гость'}
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Выберите книгу</h3>
              
              <div className="space-y-3">
                {mockBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedBook.id === book.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {book.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Статистика</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Комментарии</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Средняя оценка</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">4.3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Активные читатели</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Рост за неделю</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Возможности</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Оценки от 1 до 5 звезд</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Ответы на комментарии</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Лайки и дизлайки</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Редактирование комментариев</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Сортировка и фильтрация</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Модерация контента</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Book Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  {selectedBook.title.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedBook.title}
                  </h2>
                  <p className="text-gray-600 mb-3">
                    Автор: <span className="font-medium">{selectedBook.author}</span>
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedBook.description}
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-bold text-gray-900">4.3</span>
                  </div>
                  <span className="text-sm text-gray-500">127 отзывов</span>
                </div>
              </div>
            </div>

            {/* Comments Component */}
            <BookComments
              bookId={selectedBook.id}
              bookTitle={selectedBook.title}
              currentUserId={currentUserId}
              isReadOnly={isReadOnly}
            />

            {/* Additional Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Модерация</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Автоматическая фильтрация</span>
                    <span className="text-green-600 font-medium">Включена</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Проверка на спам</span>
                    <span className="text-green-600 font-medium">Активна</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ручная модерация</span>
                    <span className="text-blue-600 font-medium">По жалобам</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Заблокированные слова</span>
                    <span className="text-gray-900 font-medium">47</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Настройки</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Анонимные комментарии</span>
                    <span className="text-red-600 font-medium">Запрещены</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Максимум символов</span>
                    <span className="text-gray-900 font-medium">500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Уведомления автору</span>
                    <span className="text-green-600 font-medium">Включены</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Экспорт комментариев</span>
                    <span className="text-blue-600 font-medium">Доступен</span>
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