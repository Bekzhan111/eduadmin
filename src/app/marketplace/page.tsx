'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonLoader } from '@/components/ui/skeleton';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { BookOpen, Search, Star, Users, SortAsc, SortDesc } from 'lucide-react';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  price: number;
  cover_image: string;
  language: string;
  pages_count: number;
  schools_purchased: number;
  downloads_count: number;
  created_at: string;
  author: string;
}

export default function MarketplacePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique values for filters
  const categories = [...new Set(books.map(book => book.category).filter(Boolean))];
  const grades = [...new Set(books.map(book => book.grade_level).filter(Boolean))];

  const filterAndSortBooks = useCallback(() => {
    const filtered = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      const matchesGrade = selectedGrade === 'all' || book.grade_level === selectedGrade;
      
      return matchesSearch && matchesCategory && matchesGrade;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'price':
          return a.price - b.price;
        case 'grade':
          return a.grade_level.localeCompare(b.grade_level);
        default:
          return 0;
      }
    });

    setFilteredBooks(sorted);
  }, [books, searchTerm, selectedCategory, selectedGrade, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    filterAndSortBooks();
  }, [filterAndSortBooks]);

  const fetchBooks = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
        return;
      }

      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedGrade('all');
    setSortBy('popularity');
    setSortOrder('desc');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <SkeletonLoader type="text" lines={2} className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <SkeletonLoader type="custom" count={4} height={40} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={9} height={400} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Образовательные Книги
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Просмотрите нашу коллекцию из {books.length} образовательных книг
          </p>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Поиск книг..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все Категории</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Класс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все Классы</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировать по" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Популярности</SelectItem>
                <SelectItem value="title">Названию</SelectItem>
                <SelectItem value="price">Цене</SelectItem>
                <SelectItem value="newest">Новизне</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              {sortOrder === 'asc' ? 'А-Я' : 'Я-А'}
            </Button>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory !== 'all' || selectedGrade !== 'all') && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Активные фильтры:</span>
              {searchTerm && (
                <Badge variant="secondary">Поиск: &quot;{searchTerm}&quot;</Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary">Категория: {selectedCategory}</Badge>
              )}
              {selectedGrade !== 'all' && (
                <Badge variant="secondary">Класс: {selectedGrade}</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Очистить всё
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-300">
            Показано {filteredBooks.length} из {books.length} книг
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Книги не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Попробуйте изменить фильтры или поисковые запросы
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Очистить Фильтры
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  {book.cover_image ? (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                      <Image
                        src={book.cover_image || "/placeholder-book.jpg"}
                        alt={book.title}
                        width={200}
                        height={280}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {book.grade_level && (
                        <Badge variant="secondary" className="text-xs">
                          {book.grade_level}
                        </Badge>
                      )}
                      {book.category && (
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg line-clamp-2">
                      {book.title}
                    </CardTitle>
                    
                    {book.course && (
                      <CardDescription className="text-sm text-blue-600 dark:text-blue-400">
                        {book.course}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    {book.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {book.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {book.pages_count && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {book.pages_count} стр.
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {book.schools_purchased} школ
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${book.price || 'Бесплатно'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {book.language === 'English' ? 'Английский' : book.language || 'Русский'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href={`/marketplace/books/${book.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Подробнее
                      </Button>
                    </Link>
                    <Link href={`/marketplace/books/${book.id}/purchase`}>
                      <Button size="sm" className="w-full">
                        Купить Книгу
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 