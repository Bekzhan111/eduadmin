'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, SortAsc, SortDesc, Grid, List, Star,
  User, BookOpen, Eye, Download,
  Clock, ChevronDown, ChevronUp,
  Sliders, RotateCcw, Bookmark, Share2
} from 'lucide-react';

// Types
export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  publicationDate: string;
  rating: number;
  ratingsCount: number;
  views: number;
  downloads: number;
  language: string;
  format: string[];
  thumbnail: string;
  isBookmarked: boolean;
  readingTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SearchFilters {
  query: string;
  category: string;
  author: string;
  language: string;
  rating: number;
  publicationYear: string;
  difficulty: string;
  format: string;
  tags: string[];
  sortBy: 'relevance' | 'rating' | 'views' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
  showBookmarkedOnly: boolean;
}

interface BookSearchProps {
  initialFilters?: Partial<SearchFilters>;
  onResultSelect?: (book: BookSearchResult) => void;
  className?: string;
}

export function BookSearch({ 
  initialFilters = {}, 
  onResultSelect,
  className = ''
}: BookSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    author: '',
    language: '',
    rating: 0,
    publicationYear: '',
    difficulty: '',
    format: '',
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
    showBookmarkedOnly: false,
    ...initialFilters
  });

  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Mock data
  const mockResults: BookSearchResult[] = [
    {
      id: '1',
      title: 'Основы программирования на JavaScript',
      author: 'Иван Петров',
      description: 'Полное руководство по изучению JavaScript с нуля до профессионального уровня. Включает практические примеры и проекты.',
      category: 'Программирование',
      tags: ['JavaScript', 'Frontend', 'Веб-разработка', 'Программирование'],
      publicationDate: '2024-01-15',
      rating: 4.8,
      ratingsCount: 234,
      views: 15847,
      downloads: 3456,
      language: 'Русский',
      format: ['PDF', 'EPUB', 'HTML'],
      thumbnail: '/books/js-basics.jpg',
      isBookmarked: true,
      readingTime: 480,
      difficulty: 'intermediate'
    },
    {
      id: '2',
      title: 'Дизайн-мышление в UX/UI',
      author: 'Анна Сидорова',
      description: 'Практическое руководство по созданию пользовательских интерфейсов и улучшению пользовательского опыта.',
      category: 'Дизайн',
      tags: ['UX', 'UI', 'Дизайн', 'Пользовательский опыт'],
      publicationDate: '2023-11-22',
      rating: 4.6,
      ratingsCount: 189,
      views: 12456,
      downloads: 2789,
      language: 'Русский',
      format: ['PDF', 'EPUB'],
      thumbnail: '/books/ux-design.jpg',
      isBookmarked: false,
      readingTime: 360,
      difficulty: 'beginner'
    },
    {
      id: '3',
      title: 'Machine Learning для начинающих',
      author: 'Дмитрий Козлов',
      description: 'Введение в мир машинного обучения и искусственного интеллекта с практическими примерами на Python.',
      category: 'ИИ и ML',
      tags: ['ML', 'Python', 'ИИ', 'Данные', 'Анализ'],
      publicationDate: '2024-02-08',
      rating: 4.9,
      ratingsCount: 312,
      views: 18923,
      downloads: 4123,
      language: 'Русский',
      format: ['PDF', 'EPUB', 'HTML'],
      thumbnail: '/books/ml-basics.jpg',
      isBookmarked: true,
      readingTime: 600,
      difficulty: 'advanced'
    },
    {
      id: '4',
      title: 'React и Next.js: Современная разработка',
      author: 'Елена Васильева',
      description: 'Изучите современные подходы к разработке веб-приложений с использованием React и Next.js.',
      category: 'Программирование',
      tags: ['React', 'Next.js', 'Frontend', 'JavaScript'],
      publicationDate: '2023-12-05',
      rating: 4.7,
      ratingsCount: 156,
      views: 9876,
      downloads: 2345,
      language: 'Русский',
      pages: 389,
      format: ['PDF', 'HTML'],
      thumbnail: '/books/react-nextjs.jpg',
      isBookmarked: false,
      readingTime: 420,
      difficulty: 'intermediate'
    }
  ];

  const categories = ['Программирование', 'Дизайн', 'ИИ и ML', 'Бизнес', 'Наука', 'Искусство'];
  const languages = ['Русский', 'English', 'Español', 'Français', 'Deutsch'];
  const difficulties = [
    { value: 'beginner', label: 'Начинающий' },
    { value: 'intermediate', label: 'Средний' },
    { value: 'advanced', label: 'Продвинутый' }
  ];
  const formats = ['PDF', 'EPUB', 'HTML', 'MOBI'];

  // Filter and search logic
  const filteredResults = useMemo(() => {
    let filtered = [...mockResults];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query) ||
        book.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(book => book.category === filters.category);
    }

    // Author filter
    if (filters.author) {
      filtered = filtered.filter(book => 
        book.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    // Language filter
    if (filters.language) {
      filtered = filtered.filter(book => book.language === filters.language);
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(book => book.rating >= filters.rating);
    }

    // Publication year filter
    if (filters.publicationYear) {
      filtered = filtered.filter(book => 
        new Date(book.publicationDate).getFullYear().toString() === filters.publicationYear
      );
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(book => book.difficulty === filters.difficulty);
    }

    // Format filter
    if (filters.format) {
      filtered = filtered.filter(book => book.format.includes(filters.format));
    }

    // Bookmarked only filter
    if (filters.showBookmarkedOnly) {
      filtered = filtered.filter(book => book.isBookmarked);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'views':
          comparison = a.views - b.views;
          break;
        case 'date':
          comparison = new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime();
          break;
        default: // relevance
          comparison = 0;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [filters, mockResults]);

  useEffect(() => {
    setResults(filteredResults);
    setTotalResults(filteredResults.length);
  }, [filteredResults]);

  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    setIsLoading(true);
    
    // Add to recent searches
    if (filters.query && !recentSearches.includes(filters.query)) {
      setRecentSearches(prev => [filters.query, ...prev.slice(0, 4)]);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      category: '',
      author: '',
      language: '',
      rating: 0,
      publicationYear: '',
      difficulty: '',
      format: '',
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      showBookmarkedOnly: false
    });
  };

  const toggleBookmark = (bookId: string) => {
    setResults(prev => prev.map(book => 
      book.id === bookId ? { ...book, isBookmarked: !book.isBookmarked } : book
    ));
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

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Search Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Поиск книг</h2>
            <p className="text-gray-600">Найдите книги по любым критериям</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск по названию, автору, тегам..."
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Поиск'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4"
          >
            <Sliders className="h-5 w-5 mr-2" />
            Фильтры
            {showAdvancedFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !filters.query && (
          <div className="mt-4">
            <Label className="text-sm text-gray-600 mb-2 block">Недавние поиски:</Label>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleFilterChange('query', search)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Категория</Label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Язык</Label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Любой язык</option>
                {languages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Минимальный рейтинг: {filters.rating > 0 ? `${filters.rating}+` : 'Любой'}
              </Label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>5</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Сложность</Label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Любая сложность</option>
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Формат</Label>
              <select
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Любой формат</option>
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showBookmarkedOnly}
                onChange={(e) => handleFilterChange('showBookmarkedOnly', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Только закладки</span>
            </label>
          </div>

          {/* Reset Filters */}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={resetFilters} className="text-gray-600">
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить фильтры
            </Button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Найдено {totalResults} книг
            </h3>
            {filters.query && (
              <span className="text-sm text-gray-600">
                по запросу &quot;{filters.query}&quot;
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-600">Сортировка:</Label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="relevance">Релевантность</option>
                <option value="rating">Рейтинг</option>
                <option value="views">Популярность</option>
                <option value="date">Дата публикации</option>
                <option value="title">Название</option>
              </select>
              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Поиск...</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Книги не найдены</h3>
            <p className="text-gray-600 mb-4">Попробуйте изменить параметры поиска или сбросить фильтры</p>
            <Button variant="outline" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {results.map((book) => (
              <div
                key={book.id}
                className={`border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                  viewMode === 'grid' ? 'p-4' : 'p-4 flex space-x-4'
                }`}
                onClick={() => onResultSelect?.(book)}
              >
                {/* Thumbnail */}
                <div className={viewMode === 'grid' ? 'mb-4' : 'flex-shrink-0'}>
                  <div className={`bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold ${
                    viewMode === 'grid' ? 'w-full h-48' : 'w-16 h-20'
                  }`}>
                    {book.title.charAt(0)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {book.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(book.id);
                      }}
                      className="text-gray-400 hover:text-blue-600 ml-2"
                    >
                      <Bookmark className={`h-5 w-5 ${book.isBookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    <User className="h-3 w-3 inline mr-1" />
                    {book.author}
                  </p>

                  {viewMode === 'list' && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-2">
                    {renderStars(book.rating)}
                    <span className="text-sm text-gray-600">
                      {book.rating} ({book.ratingsCount})
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{book.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Download className="h-3 w-3" />
                      <span>{book.downloads.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatReadingTime(book.readingTime)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{book.pages} стр.</span>
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{book.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Поделиться
                    </Button>
                    <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                      Подробнее
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {results.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Показано 1-{Math.min(results.length, 20)} из {totalResults} результатов
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1}>
                Предыдущая
              </Button>
              <Button variant="outline" size="sm">
                Следующая
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 