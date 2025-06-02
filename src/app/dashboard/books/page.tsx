'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { Search, BookOpen, Plus, Edit, Trash2, Eye, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Book = {
  id: string;
  base_url: string; // Most important column for accessing book content
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  status: 'Draft' | 'Moderation' | 'Approved' | 'Active';
  author_id: string;
  author_name?: string;
  moderator_id?: string;
  created_at: string;
  updated_at: string;
  price?: number;
  cover_image?: string;
  file_size?: number;
  pages_count?: number;
  language?: string;
  isbn?: string;
  publisher?: string;
  publication_date?: string;
  schools_purchased: number;
  schools_added: number;
  teachers_added: number;
  students_added: number;
  downloads_count?: number;
};

type BookStats = {
  total_books: number;
  active_books: number;
  draft_books: number;
  moderation_books: number;
  approved_books: number;
};

export default function BooksPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [bookStats, setBookStats] = useState<BookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'library'>('all'); // For school admin: view all books or just library

  // Available filters
  const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const courseOptions = ['Математика', 'Физика', 'Химия', 'Биология', 'Литература', 'История', 'География', 'Английский', 'Казахский', 'Русский'];
  const categoryOptions = ['Учебник', 'Рабочая тетрадь', 'Справочник', 'Руководство', 'Оценка'];
  
  // Status options based on role
  const getStatusOptions = () => {
    switch (userProfile?.role) {
      case 'author':
        return ['Черновик', 'Модерация', 'Одобрено', 'Активна']; // Authors see ALL their books statuses
      case 'moderator':
        return ['Модерация', 'Одобрено']; // Moderators see books for moderation
      case 'super_admin':
        return ['Черновик', 'Модерация', 'Одобрено', 'Активна']; // Super admin sees all
      default:
        return ['Активна']; // School admin, teachers, students see only active books
    }
  };

  const statusOptions = getStatusOptions();

  // Status translation mapping
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'Draft': return 'Черновик';
      case 'Moderation': return 'Модерация';
      case 'Approved': return 'Одобрено';
      case 'Active': return 'Активна';
      default: return status;
    }
  };

  const isStatusMatch = (bookStatus: string, targetStatus: string): boolean => {
    return bookStatus === targetStatus || translateStatus(bookStatus) === targetStatus;
  };

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Build query based on user role
      let query = supabase
        .from('books')
        .select(`
          id,
          base_url,
          title,
          description,
          grade_level,
          course,
          category,
          status,
          author_id,
          moderator_id,
          created_at,
          updated_at,
          price,
          cover_image,
          file_size,
          pages_count,
          language,
          isbn,
          publisher,
          publication_date,
          downloads_count,
          users:author_id (display_name, email)
        `);

      // Apply role-based filters
      switch (userProfile?.role) {
        case 'author':
          // Authors see only their own books
          query = query.eq('author_id', userProfile.id);
          break;
        case 'moderator':
          // Moderators see all books in moderation status
          query = query.eq('status', 'Moderation');
          break;
        case 'school':
        case 'teacher':
        case 'student':
          if (userProfile?.role === 'school') {
            if (viewMode === 'all') {
              // School Admin sees all active books to add to their library
              query = query.eq('status', 'Active');
            } else {
              // School Admin sees only books in their library
              if (userProfile.school_id) {
                const { data: schoolBooks } = await supabase
                  .from('school_books')
                  .select('book_id')
                  .eq('school_id', userProfile.school_id);
                
                const schoolBookIds = schoolBooks?.map(sb => sb.book_id) || [];
                if (schoolBookIds.length > 0) {
                  query = query
                    .eq('status', 'Active')
                    .in('id', schoolBookIds);
                } else {
                  // No books for this school, return empty result
                  query = query.eq('id', 'no-books-found');
                }
              } else {
                // User has no school_id, return empty result
                query = query.eq('id', 'no-books-found');
              }
            }
          } else {
            // Teachers and Students see only active books associated with their school
            // First get school book IDs, then filter books
            if (userProfile.school_id) {
              const { data: schoolBooks } = await supabase
                .from('school_books')
                .select('book_id')
                .eq('school_id', userProfile.school_id);
              
              const schoolBookIds = schoolBooks?.map(sb => sb.book_id) || [];
              if (schoolBookIds.length > 0) {
                query = query
                  .eq('status', 'Active')
                  .in('id', schoolBookIds);
              } else {
                // No books for this school, return empty result
                query = query.eq('id', 'no-books-found');
              }
            } else {
              // User has no school_id, return empty result
              query = query.eq('id', 'no-books-found');
            }
          }
          break;
        case 'super_admin':
          // Super admin sees all books - no additional filters
          break;
        default:
          throw new Error('Invalid role');
      }

      const { data: booksData, error: booksError } = await query.order('created_at', { ascending: false });
      
      if (booksError) {
        // If books table doesn't exist, we'll create role-specific mock data
        console.warn('Books table not found, using mock data');
        const getMockBooks = (): Book[] => {
          const baseMockBooks: Book[] = [
            {
              id: '1',
              base_url: 'math-grade-5',
              title: 'Математика 5 класс',
              description: 'Комплексный учебник математики для 5 класса',
              grade_level: '5',
              course: 'Математика',
              category: 'Учебник',
              status: 'Active' as const,
              author_id: 'author1',
              author_name: 'Проф. Айгуль Нурланова',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              price: 2500,
              schools_purchased: 45,
              schools_added: 38,
              teachers_added: 156,
              students_added: 2340
            },
            {
              id: '2',
              base_url: 'physics-grade-8',
              title: 'Физика 8 класс',
              description: 'Введение в физику с практическими экспериментами',
              grade_level: '8',
              course: 'Физика',
              category: 'Учебник',
              status: 'Active' as const,
              author_id: 'author2',
              author_name: 'Д-р Ерлан Жанбулатов',
              created_at: '2024-01-10T14:30:00Z',
              updated_at: '2024-01-10T14:30:00Z',
              price: 3200,
              schools_purchased: 32,
              schools_added: 28,
              teachers_added: 89,
              students_added: 1564
            },
            {
              id: '3',
              base_url: 'kazakh-literature-grade-10',
              title: 'Казахская литература 10 класс',
              description: 'Классическая и современная казахская литература',
              grade_level: '10',
              course: 'Литература',
              category: 'Учебник',
              status: 'Active' as const,
              author_id: 'author3',
              author_name: 'Проф. Жанар Оспанова',
              created_at: '2024-01-08T09:15:00Z',
              updated_at: '2024-01-08T09:15:00Z',
              price: 2800,
              schools_purchased: 58,
              schools_added: 51,
              teachers_added: 234,
              students_added: 3120
            },
            {
              id: '4',
              base_url: 'chemistry-workbook-grade-9',
              title: 'Рабочая тетрадь по химии 9 класс',
              description: 'Практические упражнения и лабораторные работы',
              grade_level: '9',
              course: 'Химия',
              category: 'Рабочая тетрадь',
              status: 'Moderation' as const,
              author_id: 'author4',
              author_name: 'Проф. Асел Токтарова',
              created_at: '2024-01-05T16:45:00Z',
              updated_at: '2024-01-05T16:45:00Z',
              price: 1800,
              schools_purchased: 0,
              schools_added: 0,
              teachers_added: 0,
              students_added: 0
            }
          ];

          // Filter mock data based on role
          switch (userProfile?.role) {
            case 'author':
              return baseMockBooks.filter(book => book.author_id === userProfile.id);
            case 'moderator':
              return baseMockBooks.filter(book => book.status === 'Moderation');
            case 'school':
            case 'teacher':
            case 'student':
              return baseMockBooks.filter(book => book.status === 'Active');
            case 'super_admin':
              return baseMockBooks;
            default:
              return [];
          }
        };

        const mockBooks = getMockBooks();
        setBooks(mockBooks);
        setFilteredBooks(mockBooks);
        setBookStats({
          total_books: mockBooks.length,
          active_books: mockBooks.filter(b => b.status === 'Active').length,
          draft_books: mockBooks.filter(b => b.status === 'Draft').length,
          moderation_books: mockBooks.filter(b => b.status === 'Moderation').length,
          approved_books: mockBooks.filter(b => b.status === 'Approved').length, // Using Approved instead of In Progress
        });
        return;
      }
      
      // Process real data if available
      const formattedBooks = (booksData || []).map(book => {
        const authorData = Array.isArray(book.users) ? book.users[0] : book.users;
        return {
          id: book.id,
          base_url: book.base_url,
          title: book.title,
          description: book.description,
          grade_level: book.grade_level,
          course: book.course,
          category: book.category,
          status: book.status as 'Draft' | 'Moderation' | 'Approved' | 'Active',
          author_id: book.author_id,
          author_name: authorData?.display_name || authorData?.email || 'Unknown Author',
          created_at: book.created_at,
          updated_at: book.updated_at,
          price: book.price,
          cover_image: book.cover_image,
          schools_purchased: 0, // Would be calculated from purchases table
          schools_added: 0,     // Would be calculated from school_books table
          teachers_added: 0,    // Would be calculated from teacher_books table
          students_added: 0,    // Would be calculated from student_books table
        };
      });
      
      setBooks(formattedBooks);
      setFilteredBooks(formattedBooks);
      
      // Calculate stats
      const stats: BookStats = {
        total_books: formattedBooks.length,
        active_books: formattedBooks.filter(b => b.status === 'Active').length,
        draft_books: formattedBooks.filter(b => b.status === 'Draft').length,
        moderation_books: formattedBooks.filter(b => b.status === 'Moderation').length,
        approved_books: formattedBooks.filter(b => b.status === 'Approved').length, // Using Approved instead of In Progress
      };
      setBookStats(stats);
      
    } catch (error) {
      console.error('Error fetching books:', error);
      setError(error instanceof Error ? error.message : 'Не удалось получить книги');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, viewMode]);

  // Filter books based on search term and filters
  useEffect(() => {
    let filtered = books;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(book => 
        (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.author_name && book.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(book => book.grade_level === gradeFilter);
    }
    
    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(book => book.course === courseFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(book => book.category === categoryFilter);
    }
    
    setFilteredBooks(filtered);
  }, [books, searchTerm, gradeFilter, courseFilter, statusFilter, categoryFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin' && userProfile.role !== 'author' && userProfile.role !== 'moderator' && userProfile.role !== 'school' && userProfile.role !== 'teacher' && userProfile.role !== 'student') {
        setError('Access denied. Only authorized users can view this page.');
        setIsLoading(false);
        return;
      }
      
      fetchBooks();
    }
  }, [authLoading, userProfile, fetchBooks]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Активна':
        return 'bg-green-500 text-white';
      case 'Approved':
      case 'Одобрено':
        return 'bg-blue-500 text-white';
      case 'Moderation':
      case 'Модерация':
        return 'bg-yellow-500 text-white';
      case 'Draft':
      case 'Черновик':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get status waiting message for authors
  const getStatusWaitingMessage = (status: string) => {
    switch (status) {
      case 'Moderation':
      case 'Модерация':
        return '⏳ Ожидает модерацию';
      case 'Approved':
      case 'Одобрено':
        return '✅ Одобрено! Ожидает активации';
      case 'Active':
      case 'Активна':
        return '🎉 Активна и доступна пользователям';
      case 'Draft':
      case 'Черновик':
        return '📝 Черновик - можно редактировать';
      default:
        return '';
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту книгу? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);
      
      if (error) {
        throw new Error(`Failed to delete book: ${error.message}`);
      }
      
      setSuccess('Книга удалена успешно');
      await fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить книгу');
    }
  };

  const handleSendToModeration = async (bookId: string) => {
    if (!confirm('Отправить книгу на модерацию? После отправки вы не сможете редактировать книгу до завершения модерации.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Moderation',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);
      
      if (error) {
        throw new Error(`Failed to send book to moderation: ${error.message}`);
      }
      
      setSuccess('Книга отправлена на модерацию! Модераторы рассмотрят ее в ближайшее время.');
      await fetchBooks();
    } catch (error) {
      console.error('Error sending book to moderation:', error);
      setError(error instanceof Error ? error.message : 'Не удалось отправить книгу на модерацию');
    }
  };

  const handleApproveBook = async (bookId: string) => {
    if (!confirm('Одобрить эту книгу? Она будет передана суперадминистратору для активации.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Approved',
          moderator_id: userProfile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);
      
      if (error) {
        throw new Error(`Failed to approve book: ${error.message}`);
      }
      
      setSuccess('Книга одобрена! Она передана суперадминистратору для активации.');
      await fetchBooks();
    } catch (error) {
      console.error('Error approving book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось одобрить книгу');
    }
  };

  const handleRejectBook = async (bookId: string) => {
    const reason = prompt('Укажите причину отклонения книги:');
    if (!reason) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Draft',
          moderator_id: userProfile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);
      
      if (error) {
        throw new Error(`Failed to reject book: ${error.message}`);
      }
      
      setSuccess(`Книга отклонена и возвращена автору как черновик. Причина: ${reason}`);
      await fetchBooks();
    } catch (error) {
      console.error('Error rejecting book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось отклонить книгу');
    }
  };

  const handleActivateBook = async (bookId: string) => {
    if (!confirm('Активировать эту книгу? Она станет доступна всем пользователям системы.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);
      
      if (error) {
        throw new Error(`Failed to activate book: ${error.message}`);
      }
      
      setSuccess('Книга активирована! Теперь она доступна всем пользователям системы.');
      await fetchBooks();
    } catch (error) {
      console.error('Error activating book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось активировать книгу');
    }
  };

  const handleRemoveBookFromSchool = async (bookId: string) => {
    if (!userProfile?.school_id) {
      setError('School ID not found. Please contact administrator.');
      return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить эту книгу из библиотеки школы?')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('school_books')
        .delete()
        .eq('school_id', userProfile.school_id)
        .eq('book_id', bookId);
      
      if (error) {
        throw new Error(`Failed to remove book from school library: ${error.message}`);
      }
      
      setSuccess('Книга удалена из библиотеки школы успешно');
      await fetchBooks();
    } catch (error) {
      console.error('Error removing book from school library:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить книгу из библиотеки школы');
    }
  };

  const handleAddBookToSchool = async (bookId: string) => {
    if (!userProfile?.school_id) {
      setError('School ID not found. Please contact administrator.');
      return;
    }
    
    if (!confirm('Вы уверены, что хотите добавить эту книгу в библиотеку школы? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('school_books')
        .insert({
          school_id: userProfile.school_id,
          book_id: bookId
        });
      
      if (error) {
        throw new Error(`Failed to add book to school library: ${error.message}`);
      }
      
      setSuccess('Книга добавлена в библиотеку школы успешно');
      await fetchBooks();
    } catch (error) {
      console.error('Error adding book to school library:', error);
      setError(error instanceof Error ? error.message : 'Не удалось добавить книгу в библиотеку школы');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading books...</p>
        </div>
      </div>
    );
  }

  if (error && !books.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Ошибка</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Перезагрузить Страницу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/3" />
            <SkeletonLoader type="text" lines={1} className="w-1/2" />
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonLoader type="custom" height={32} width={120} />
            <SkeletonLoader type="custom" height={40} width={140} />
          </div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SkeletonLoader type="custom" count={5} height={120} />
        </div>
        
        {/* Filters card skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={5} />
          </div>
        </div>
        
        {/* Table skeleton */}
        <SkeletonLoader type="table" rows={8} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Управление Книгами
        </h1>
        <div className="flex items-center space-x-4">
          {userProfile?.role === 'author' && (
            <Link href="/dashboard/books/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Создать книгу
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={fetchBooks}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Statistics Cards */}
      {bookStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего Книг</p>
                  <p className="text-2xl font-bold">{bookStats.total_books}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Активные</p>
                  <p className="text-2xl font-bold">{bookStats.active_books}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Модерация</p>
                  <p className="text-2xl font-bold">{bookStats.moderation_books}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Черновики</p>
                  <p className="text-2xl font-bold">{bookStats.draft_books}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Одобрено</p>
                  <p className="text-2xl font-bold">{bookStats.approved_books}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры Книг
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск книг..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Grade Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Класс</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все Классы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Классы</SelectItem>
                  {gradeOptions.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade} Класс</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Предмет</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все Предметы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Предметы</SelectItem>
                  {courseOptions.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все Категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Категории</SelectItem>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все Статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Статусы</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Библиотека Книг</CardTitle>
          <CardDescription>
            Образовательные книги со статистикой покупок и использования
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Книга</TableHead>
                  <TableHead>Класс</TableHead>
                  <TableHead>Предмет</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>Школы</TableHead>
                  <TableHead>Учителя</TableHead>
                  <TableHead>Студенты</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.title}</div>
                        <div className="text-sm text-gray-500">{book.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.grade_level} Класс</Badge>
                    </TableCell>
                    <TableCell>{book.course}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge className={getStatusBadgeColor(book.status)}>
                          {translateStatus(book.status)}
                        </Badge>
                        {userProfile?.role === 'author' && book.author_id === userProfile.id && (
                          <div className="text-xs text-gray-600 mt-1">
                            {getStatusWaitingMessage(book.status)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{book.author_name}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-sm font-medium">{book.schools_purchased} куплено</div>
                        <div className="text-xs text-gray-500">{book.schools_added} добавлено</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center text-sm">{book.teachers_added}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center text-sm">{book.students_added}</div>
                    </TableCell>
                    <TableCell>
                      {book.price ? `₸${book.price.toLocaleString()}` : 'Бесплатно'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Author actions */}
                        {userProfile?.role === 'author' && book.author_id === userProfile.id && (
                          <>
                            {isStatusMatch(book.status, 'Draft') && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600"
                                  onClick={() => handleSendToModeration(book.id)}
                                >
                                  Отправить на модерацию
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {isStatusMatch(book.status, 'Moderation') && (
                              <div className="text-xs text-yellow-600 font-medium">
                                ⏳ На модерации - редактирование недоступно
                              </div>
                            )}
                            
                            {isStatusMatch(book.status, 'Approved') && (
                              <div className="text-xs text-blue-600 font-medium">
                                ✅ Одобрено - ожидает активации администратором
                              </div>
                            )}
                            
                            {isStatusMatch(book.status, 'Active') && (
                              <div className="text-xs text-green-600 font-medium">
                                🎉 Активна - доступна всем пользователям!
                              </div>
                            )}
                          </>
                        )}

                        {/* Moderator actions */}
                        {userProfile?.role === 'moderator' && isStatusMatch(book.status, 'Moderation') && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600"
                              onClick={() => handleApproveBook(book.id)}
                            >
                              Одобрить
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleRejectBook(book.id)}
                            >
                              Отклонить
                            </Button>
                          </>
                        )}

                        {/* Super Admin actions */}
                        {userProfile?.role === 'super_admin' && (
                          <>
                            {isStatusMatch(book.status, 'Approved') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600"
                                onClick={() => handleActivateBook(book.id)}
                              >
                                Активировать Книгу
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteBook(book.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* School Admin actions based on view mode */}
                        {userProfile?.role === 'school' && viewMode === 'all' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleAddBookToSchool(book.id)}
                          >
                            Добавить в Библиотеку
                          </Button>
                        )}
                        
                        {userProfile?.role === 'school' && viewMode === 'library' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveBookFromSchool(book.id)}
                          >
                            Удалить из Библиотеки
                          </Button>
                        )}

                        {/* School users - view only */}
                        {(userProfile?.role === 'school' || userProfile?.role === 'teacher' || userProfile?.role === 'student') && (
                          <Button variant="ghost" size="sm" className="text-blue-600">
                            Открыть Книгу
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Книги, соответствующие вашим критериям, не найдены.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 