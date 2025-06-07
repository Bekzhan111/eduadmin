'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Lightbulb, Star, TrendingUp, Users, Eye, Bookmark,
  Heart, Download, Clock, Brain, Target, Sparkles,
  ChevronRight, ChevronLeft, MoreHorizontal, Filter,
  Shuffle, RefreshCw, Settings, User, Book
} from 'lucide-react';

// Types
export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  ratingsCount: number;
  views: number;
  downloads: number;
  thumbnail: string;
  price: number;
  isFree: boolean;
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  similarity: number; // 0-100
  reasonType: 'similar_books' | 'same_author' | 'same_category' | 'trending' | 'collaborative' | 'personal_taste';
  reason: string;
  confidence: number; // 0-100
}

export interface UserProfile {
  favoriteCategories: string[];
  favoriteAuthors: string[];
  readingHistory: string[];
  ratings: { [bookId: string]: number };
  preferences: {
    difficulty: string[];
    languages: string[];
    formats: string[];
    priceRange: [number, number];
  };
  readingGoals: {
    booksPerMonth: number;
    preferredReadingTime: number;
    categories: string[];
  };
}

export interface RecommendationEngine {
  type: 'collaborative' | 'content_based' | 'hybrid' | 'trending' | 'personalized';
  name: string;
  description: string;
  accuracy: number;
  isActive: boolean;
}

interface BookRecommendationsProps {
  userId?: string;
  maxRecommendations?: number;
  showEngineSelector?: boolean;
  className?: string;
}

export function BookRecommendations({ 
  userId, 
  maxRecommendations = 12,
  showEngineSelector = true,
  className = ''
}: BookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>('hybrid');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterReason, setFilterReason] = useState('');

  const engines: RecommendationEngine[] = [
    {
      type: 'hybrid',
      name: 'Гибридные рекомендации',
      description: 'Сочетает различные алгоритмы для максимальной точности',
      accuracy: 92.3,
      isActive: true
    },
    {
      type: 'collaborative',
      name: 'Коллаборативная фильтрация',
      description: 'На основе предпочтений похожих пользователей',
      accuracy: 87.8,
      isActive: true
    },
    {
      type: 'content_based',
      name: 'Контентные рекомендации',
      description: 'На основе характеристик прочитанных книг',
      accuracy: 84.5,
      isActive: true
    },
    {
      type: 'personalized',
      name: 'Персональные рекомендации',
      description: 'На основе вашего профиля и истории чтения',
      accuracy: 89.1,
      isActive: true
    },
    {
      type: 'trending',
      name: 'Популярные сейчас',
      description: 'Самые популярные книги среди пользователей',
      accuracy: 76.2,
      isActive: true
    }
  ];

  // Mock data
  const mockRecommendations: BookRecommendation[] = [
    {
      id: '1',
      title: 'Advanced React Patterns',
      author: 'Джон Смит',
      description: 'Углубленное изучение продвинутых паттернов React для создания масштабируемых приложений.',
      category: 'Программирование',
      tags: ['React', 'JavaScript', 'Frontend', 'Паттерны'],
      rating: 4.8,
      ratingsCount: 324,
      views: 15847,
      downloads: 3456,
      thumbnail: '/books/react-advanced.jpg',
      price: 799,
      isFree: false,
      readingTime: 420,
      difficulty: 'advanced',
      similarity: 94,
      reasonType: 'similar_books',
      reason: 'Похожа на "React и Next.js", которую вы недавно читали',
      confidence: 92
    },
    {
      id: '2',
      title: 'TypeScript Deep Dive',
      author: 'Анна Петрова',
      description: 'Полное руководство по TypeScript от основ до продвинутых техник.',
      category: 'Программирование',
      tags: ['TypeScript', 'JavaScript', 'Types', 'Разработка'],
      rating: 4.7,
      ratingsCount: 256,
      views: 12456,
      downloads: 2789,
      thumbnail: '/books/typescript-deep.jpg',
      price: 699,
      isFree: false,
      readingTime: 380,
      difficulty: 'intermediate',
      similarity: 88,
      reasonType: 'same_category',
      reason: 'Вы часто читаете книги по программированию',
      confidence: 85
    },
    {
      id: '3',
      title: 'Дизайн API: Лучшие практики',
      author: 'Михаил Сидоров',
      description: 'Как создавать красивые, понятные и эффективные API интерфейсы.',
      category: 'Программирование',
      tags: ['API', 'Backend', 'Архитектура', 'REST'],
      rating: 4.6,
      ratingsCount: 189,
      views: 9876,
      downloads: 2345,
      thumbnail: '/books/api-design.jpg',
      price: 0,
      isFree: true,
      readingTime: 290,
      difficulty: 'intermediate',
      similarity: 82,
      reasonType: 'collaborative',
      reason: 'Пользователи со схожими интересами также читают эту книгу',
      confidence: 78
    },
    {
      id: '4',
      title: 'Психология пользователей',
      author: 'Елена Васильева',
      description: 'Как понять пользователей и создать интуитивно понятные интерфейсы.',
      category: 'UX/UI',
      tags: ['UX', 'Психология', 'Интерфейсы', 'Пользователи'],
      rating: 4.9,
      ratingsCount: 412,
      views: 18923,
      downloads: 4123,
      thumbnail: '/books/user-psychology.jpg',
      price: 899,
      isFree: false,
      readingTime: 350,
      difficulty: 'beginner',
      similarity: 75,
      reasonType: 'trending',
      reason: 'Популярная книга среди читателей технической литературы',
      confidence: 82
    },
    {
      id: '5',
      title: 'Node.js Microservices',
      author: 'Дмитрий Козлов',
      description: 'Построение микросервисной архитектуры с использованием Node.js.',
      category: 'Программирование',
      tags: ['Node.js', 'Microservices', 'Backend', 'Архитектура'],
      rating: 4.5,
      ratingsCount: 198,
      views: 11234,
      downloads: 2567,
      thumbnail: '/books/nodejs-microservices.jpg',
      price: 749,
      isFree: false,
      readingTime: 445,
      difficulty: 'advanced',
      similarity: 86,
      reasonType: 'personal_taste',
      reason: 'Соответствует вашим предпочтениям по сложности и тематике',
      confidence: 88
    },
    {
      id: '6',
      title: 'Основы Machine Learning',
      author: 'Александр Иванов',
      description: 'Введение в мир машинного обучения с практическими примерами.',
      category: 'ИИ и ML',
      tags: ['ML', 'Python', 'ИИ', 'Алгоритмы', 'Данные'],
      rating: 4.8,
      ratingsCount: 567,
      views: 25678,
      downloads: 5234,
      thumbnail: '/books/ml-basics.jpg',
      price: 999,
      isFree: false,
      readingTime: 520,
      difficulty: 'intermediate',
      similarity: 79,
      reasonType: 'same_author',
      reason: 'Автор книги "Python для анализа данных", которая вам понравилась',
      confidence: 84
    }
  ];

  const mockUserProfile: UserProfile = {
    favoriteCategories: ['Программирование', 'UX/UI', 'ИИ и ML'],
    favoriteAuthors: ['Дмитрий Козлов', 'Анна Петрова'],
    readingHistory: ['js-basics', 'react-guide', 'ux-fundamentals'],
    ratings: { 'js-basics': 5, 'react-guide': 4, 'ux-fundamentals': 5 },
    preferences: {
      difficulty: ['intermediate', 'advanced'],
      languages: ['Русский', 'English'],
      formats: ['PDF', 'EPUB'],
      priceRange: [0, 1000]
    },
    readingGoals: {
      booksPerMonth: 3,
      preferredReadingTime: 400,
      categories: ['Программирование', 'ИИ и ML']
    }
  };

  useEffect(() => {
    loadRecommendations();
    setUserProfile(mockUserProfile);
  }, [selectedEngine, userId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter and sort recommendations based on selected engine
    let filtered = [...mockRecommendations];
    
    if (filterCategory) {
      filtered = filtered.filter(book => book.category === filterCategory);
    }
    
    if (filterReason) {
      filtered = filtered.filter(book => book.reasonType === filterReason);
    }

    // Sort by confidence/similarity
    filtered = filtered.sort((a, b) => b.confidence - a.confidence);
    
    setRecommendations(filtered.slice(0, maxRecommendations));
    setIsLoading(false);
  };

  const refreshRecommendations = () => {
    loadRecommendations();
  };

  const toggleBookmark = (bookId: string) => {
    console.log('Toggle bookmark for book:', bookId);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price} ₽`;
  };

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReasonIcon = (reasonType: string) => {
    switch (reasonType) {
      case 'similar_books':
        return <Book className="h-4 w-4 text-blue-600" />;
      case 'same_author':
        return <User className="h-4 w-4 text-green-600" />;
      case 'same_category':
        return <Target className="h-4 w-4 text-purple-600" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'collaborative':
        return <Users className="h-4 w-4 text-red-600" />;
      case 'personal_taste':
        return <Brain className="h-4 w-4 text-indigo-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-orange-600';
    return 'text-gray-600';
  };

  const itemsPerPage = 6;
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const currentRecommendations = recommendations.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Рекомендации для вас</h2>
              <p className="text-gray-600">Персональные рекомендации на основе ваших интересов</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRecommendations}
              className="text-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Настроить
            </Button>
          </div>
        </div>

        {/* Engine Selector */}
        {showEngineSelector && (
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Алгоритм рекомендаций:
            </Label>
            <div className="flex flex-wrap gap-2">
              {engines.map((engine) => (
                <button
                  key={engine.type}
                  onClick={() => setSelectedEngine(engine.type)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    selectedEngine === engine.type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{engine.name}</span>
                    <span className="text-xs opacity-75">({engine.accuracy}%)</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Категория</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Все категории</option>
                  <option value="Программирование">Программирование</option>
                  <option value="UX/UI">UX/UI</option>
                  <option value="ИИ и ML">ИИ и ML</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Причина рекомендации</Label>
                <select
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Все причины</option>
                  <option value="similar_books">Похожие книги</option>
                  <option value="same_author">Тот же автор</option>
                  <option value="same_category">Та же категория</option>
                  <option value="trending">Популярные</option>
                  <option value="collaborative">Коллаборативные</option>
                  <option value="personal_taste">Личные предпочтения</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <span>Найдено {recommendations.length} рекомендаций</span>
          <span>•</span>
          <span>Точность алгоритма: {engines.find(e => e.type === selectedEngine)?.accuracy}%</span>
          <span>•</span>
          <span>Обновлено сейчас</span>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Подбираем рекомендации...</p>
            </div>
          </div>
        ) : currentRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет рекомендаций</h3>
            <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или алгоритм рекомендаций</p>
            <Button variant="outline" onClick={refreshRecommendations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить рекомендации
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRecommendations.map((book) => (
              <div
                key={book.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="mb-4 relative">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                    {book.title.charAt(0)}
                  </div>
                  
                  {/* Confidence Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    book.confidence >= 90 ? 'bg-green-100 text-green-800' :
                    book.confidence >= 80 ? 'bg-blue-100 text-blue-800' :
                    book.confidence >= 70 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {book.confidence}%
                  </div>

                  {/* Bookmark */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(book.id);
                    }}
                    className="absolute top-2 left-2 text-white hover:text-blue-200"
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h4>

                  <p className="text-sm text-gray-600">
                    <User className="h-3 w-3 inline mr-1" />
                    {book.author}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    {renderStars(book.rating)}
                    <span className="text-sm text-gray-600">
                      {book.rating} ({book.ratingsCount})
                    </span>
                  </div>

                  {/* Recommendation Reason */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      {getReasonIcon(book.reasonType)}
                      <div className="flex-1">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {book.reason}
                        </p>
                        <div className={`text-xs font-medium mt-1 ${getConfidenceColor(book.confidence)}`}>
                          Уверенность: {book.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{book.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatReadingTime(book.readingTime)}</span>
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {book.difficulty === 'beginner' ? 'Начальный' :
                       book.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                    </span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(book.price)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Просмотр
                      </Button>
                      <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                        {book.isFree ? 'Читать' : 'Купить'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Страница {currentPage + 1} из {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Предыдущая
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Следующая
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Insights */}
      {userProfile && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              Ваш профиль читателя
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Любимые категории</h4>
                <div className="flex flex-wrap gap-1">
                  {userProfile.favoriteCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Цель чтения</h4>
                <p className="text-sm text-gray-600">
                  {userProfile.readingGoals.booksPerMonth} книг в месяц
                </p>
                <p className="text-xs text-gray-500">
                  Среднее время: {formatReadingTime(userProfile.readingGoals.preferredReadingTime)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Прогресс</h4>
                <p className="text-sm text-gray-600">
                  Прочитано: {userProfile.readingHistory.length} книг
                </p>
                <p className="text-xs text-gray-500">
                  Средняя оценка: {
                    Object.values(userProfile.ratings).reduce((a, b) => a + b, 0) / 
                    Object.values(userProfile.ratings).length || 0
                  }.0/5
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 