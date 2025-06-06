'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen,
  Search,
  Star,
  Clock,
  User,
  Filter,
  RefreshCw,
  Share,
  Heart,
  Play,
  Bookmark,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Book = {
  id: string;
  base_url: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  cover_image?: string;
  pages_count?: number;
  language?: string;
  author_name?: string;
  created_at: string;
};

export default function MyBooksPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const fetchAvailableBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Получаем все активные книги
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          base_url,
          title,
          description,
          grade_level,
          course,
          category,
          cover_image,
          pages_count,
          language,
          created_at,
          author_id
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      
      if (booksError) {
        throw new Error(`Ошибка загрузки книг: ${booksError.message}`);
      }
      
      // Получаем данные авторов
      let authorsData: Array<{ id: string; display_name?: string; email: string }> = [];
      if (booksData && booksData.length > 0) {
        const authorIds = [...new Set(booksData.map(book => book.author_id).filter(Boolean))];
        if (authorIds.length > 0) {
          const { data: authors } = await supabase
            .from('users')
            .select('id, display_name, email')
            .in('id', authorIds);
          
          if (authors) {
            authorsData = authors;
          }
        }
      }

      // Форматируем данные
      const formattedBooks = (booksData || []).map(book => {
        const authorData = authorsData.find(author => author.id === book.author_id);
        return {
          id: book.id,
          base_url: book.base_url,
          title: book.title,
          description: book.description,
          grade_level: book.grade_level,
          course: book.course,
          category: book.category,
          cover_image: book.cover_image,
          pages_count: book.pages_count,
          language: book.language,
          author_name: authorData?.display_name || authorData?.email || 'Автор неизвестен',
          created_at: book.created_at,
        };
      });
      
      setBooks(formattedBooks);
      setFilteredBooks(formattedBooks);
      
    } catch (error) {
      console.error('Error fetching books:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter books
  useEffect(() => {
    let filtered = books;
    
    if (searchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.course.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (courseFilter !== 'all') {
      filtered = filtered.filter(book => book.course === courseFilter);
    }
    
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(book => book.grade_level === gradeFilter);
    }
    
    setFilteredBooks(filtered);
  }, [books, searchTerm, courseFilter, gradeFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'teacher' && userProfile.role !== 'student') {
        setError('Эта страница доступна только для учителей и учеников.');
        setIsLoading(false);
        return;
      }
      
      fetchAvailableBooks();
    }
  }, [authLoading, userProfile, fetchAvailableBooks]);

  const handleShare = (book: Book) => {
    navigator.clipboard.writeText(`${window.location.origin}/read/${book.base_url}`);
    alert('📤 Ссылка на книгу скопирована!');
  };

  const handleAddToFavorites = (book: Book) => {
    // Здесь можно добавить логику сохранения в избранное
    console.log('Adding to favorites:', book.id);
    alert('⭐ Книга добавлена в избранное!');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загружаем ваши книги...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Ошибка</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Перезагрузить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Получаем уникальные курсы и классы для фильтров
  const courses = [...new Set(books.map(book => book.course).filter(Boolean))];
  const grades = [...new Set(books.map(book => book.grade_level).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          📚 Мои Книги
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Изучайте, читайте и открывайте новые знания с нашей библиотекой образовательных книг
        </p>
        <div className="flex items-center justify-center mt-4">
          <Badge variant="default" className="bg-green-100 text-green-800 px-4 py-2">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            {filteredBooks.length} книг доступно для чтения
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Всего Книг</p>
                <p className="text-2xl font-bold text-blue-800">{books.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Новые</p>
                <p className="text-2xl font-bold text-green-800">
                  {books.filter(b => new Date(b.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Избранные</p>
                <p className="text-2xl font-bold text-purple-800">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Недавние</p>
                <p className="text-2xl font-bold text-orange-800">
                  {books.slice(0, 5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Поиск и Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Найти книгу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Предмет</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все предметы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все предметы</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Класс</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все классы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все классы</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade} класс</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Действия</label>
              <Button 
                onClick={fetchAvailableBooks} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200">
              <CardContent className="p-0">
                {/* Book Cover */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-t-lg overflow-hidden">
                  {book.cover_image ? (
                    <Image
                      src={book.cover_image}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-blue-500 dark:text-blue-300" />
                    </div>
                  )}
                  
                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddToFavorites(book)}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleShare(book)}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* New Badge */}
                  {new Date(book.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-500 text-white text-xs">НОВАЯ</Badge>
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      {book.author_name}
                    </div>
                    {book.pages_count && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {book.pages_count} страниц
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {book.grade_level} класс
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {book.course}
                    </Badge>
                    {book.category && (
                      <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                        {book.category}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Link href={`/read/${book.base_url}`} target="_blank" className="block">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200">
                        <Play className="h-4 w-4 mr-2" />
                        📖 Читать сейчас
                      </Button>
                    </Link>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleAddToFavorites(book)}
                      >
                        <Bookmark className="h-3 w-3 mr-1" />
                        Сохранить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleShare(book)}
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Поделиться
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Книги не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || courseFilter !== 'all' || gradeFilter !== 'all' 
                ? 'Попробуйте изменить фильтры поиска.'
                : 'В данный момент нет доступных книг для чтения.'}
            </p>
            {(searchTerm || courseFilter !== 'all' || gradeFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCourseFilter('all');
                  setGradeFilter('all');
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 