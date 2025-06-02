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
import { Search, BookOpen, Plus, Edit, Trash2, Eye, Filter, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { fetchBooksWithCorrectClient } from '@/utils/supabase-admin';

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

  // States for adding existing books
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [existingBooks, setExistingBooks] = useState<Book[]>([]);
  const [existingBooksSearch, setExistingBooksSearch] = useState('');
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

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
      
      console.log('🔍 Fetching books for role:', userProfile?.role, 'User ID:', userProfile?.id);
      
      // Используем новую функцию для получения книг с правильным клиентом
      const { data: booksData, error: booksError } = await fetchBooksWithCorrectClient(
        userProfile?.role,
        userProfile?.id,
        supabase
      );
      
      if (booksError) {
        console.error('❌ Database error:', booksError);
        console.error('📊 Error details:', JSON.stringify(booksError, null, 2));
        
        // Show the actual error to the user instead of falling back to mock data
        setError(`Ошибка загрузки книг: ${booksError.message}. Проверьте подключение к базе данных.`);
        setBooks([]);
        setFilteredBooks([]);
        setBookStats({
          total_books: 0,
          active_books: 0,
          draft_books: 0,
          moderation_books: 0,
          approved_books: 0,
        });
        return;
      }
      
      console.log('✅ Books fetched successfully:', booksData?.length || 0, 'books');
      
      // Получаем данные авторов отдельным запросом
      let authorsData: any[] = [];
      if (booksData && booksData.length > 0) {
        const authorIds = [...new Set(booksData.map((book: any) => book.author_id).filter(Boolean))];
        if (authorIds.length > 0) {
          console.log('👥 Fetching authors data for', authorIds.length, 'authors');
          const { data: authors, error: authorsError } = await supabase
            .from('users')
            .select('id, display_name, email')
            .in('id', authorIds);
          
          if (!authorsError && authors) {
            authorsData = authors;
            console.log('✅ Authors data fetched:', authorsData.length, 'authors');
          } else {
            console.warn('⚠️ Could not fetch authors data:', authorsError?.message);
          }
        }
      }

      // Форматируем данные
      const formattedBooks = (booksData || []).map((book: any) => {
        const authorData = authorsData.find(author => author.id === book.author_id);
        return {
          id: book.id,
          base_url: book.base_url,
          title: book.title,
          description: book.description,
          grade_level: book.grade_level,
          course: book.course,
          category: book.category,
          status: book.status,
          author_id: book.author_id,
          author_name: authorData?.display_name || authorData?.email || 'Unknown Author',
          created_at: book.created_at,
          updated_at: book.updated_at,
          price: book.price,
          cover_image: book.cover_image,
          schools_purchased: 0,
          schools_added: 0,
          teachers_added: 0,
          students_added: 0,
        };
      });
      
      console.log('📊 Formatted books:', formattedBooks.length);
      console.log('📊 Status breakdown:', {
        draft: formattedBooks.filter((b: any) => b.status === 'Draft').length,
        moderation: formattedBooks.filter((b: any) => b.status === 'Moderation').length,
        approved: formattedBooks.filter((b: any) => b.status === 'Approved').length,
        active: formattedBooks.filter((b: any) => b.status === 'Active').length,
      });
      
      setBooks(formattedBooks);
      setFilteredBooks(formattedBooks);
      
      // Считаем статистику
      const stats: BookStats = {
        total_books: formattedBooks.length,
        active_books: formattedBooks.filter((b: any) => b.status === 'Active').length,
        draft_books: formattedBooks.filter((b: any) => b.status === 'Draft').length,
        moderation_books: formattedBooks.filter((b: any) => b.status === 'Moderation').length,
        approved_books: formattedBooks.filter((b: any) => b.status === 'Approved').length,
      };
      setBookStats(stats);
      
    } catch (error) {
      console.error('❌ Error fetching books:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(`Не удалось получить книги: ${errorMessage}`);
      setBooks([]);
      setFilteredBooks([]);
      setBookStats({
        total_books: 0,
        active_books: 0,
        draft_books: 0,
        moderation_books: 0,
        approved_books: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

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
        return '✅ Одобрено! Ожидает публикации администратором';
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

  // Get moderator status info
  const getModeratorStatusInfo = (book: Book) => {
    if (book.moderator_id && book.status === 'Approved') {
      return {
        approved: true,
        moderatorId: book.moderator_id,
        message: '✅ Одобрено модератором',
        submessage: '🔄 Ожидает публикации администратором'
      };
    }
    return null;
  };

  // Get book workflow status for different roles
  const getWorkflowStatus = (book: Book, userRole?: string) => {
    switch (userRole) {
      case 'author':
        if (book.status === 'Moderation') return '📤 Отправлено на модерацию - ожидает проверки';
        if (book.status === 'Approved') return '✅ Одобрено модератором - ожидает публикации';
        if (book.status === 'Active') return '🎉 Опубликовано - доступно всем пользователям!';
        if (book.status === 'Draft') return '📝 Черновик - можно редактировать и отправить на модерацию';
        break;
      case 'moderator':
        if (book.status === 'Moderation') return '📋 Требует вашего решения';
        if (book.status === 'Approved') return '✅ Одобрено - передано администратору';
        break;
      case 'super_admin':
        if (book.status === 'Moderation') return '⏳ На модерации - ожидает проверки модератором';
        if (book.status === 'Approved') return '📋 Готово к публикации';
        if (book.status === 'Active') return '✅ Опубликовано и доступно всем';
        break;
    }
    return '';
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

  const handleApproveBook = async (bookId: string, bookTitle: string, moderatorName: string) => {
    const confirmed = confirm(`Вы уверены, что хотите одобрить книгу "${bookTitle}"?\n\nМодератор: ${moderatorName}`)
    if (!confirmed) return

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId)

      if (error) throw error

      setSuccess(`Книга "${bookTitle}" одобрена модератором ${moderatorName}!`)
      await fetchBooks()
    } catch (error: any) {
      setError(`Ошибка при одобрении книги: ${error.message}`)
    }
  }

  const handleRejectBook = async (bookId: string, bookTitle: string, moderatorName: string) => {
    const reason = prompt(`Укажите причину отклонения книги "${bookTitle}":\n\nМодератор: ${moderatorName}`)
    if (!reason) return

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId)

      if (error) throw error

      setSuccess(`Книга "${bookTitle}" отклонена модератором ${moderatorName}. Причина: ${reason}`)
      await fetchBooks()
    } catch (error: any) {
      setError(`Ошибка при отклонении книги: ${error.message}`)
    }
  }

  const handleActivateBook = async (bookId: string, bookTitle: string, adminName: string) => {
    const confirmed = confirm(`Вы уверены, что хотите опубликовать книгу "${bookTitle}"?\n\nАдминистратор: ${adminName}\n\nКнига станет доступна всем пользователям.`)
    if (!confirmed) return

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId)

      if (error) throw error

      setSuccess(`Книга "${bookTitle}" опубликована администратором ${adminName} и теперь доступна всем пользователям!`)
      await fetchBooks()
    } catch (error: any) {
      setError(`Ошибка при публикации книги: ${error.message}`)
    }
  }

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

  const handleAddExistingBook = async (originalBookId: string, originalTitle: string) => {
    if (!userProfile) {
      setError('Пользователь не авторизован');
      return;
    }

    if (!confirm(`Вы уверены, что хотите добавить книгу "${originalTitle}" в ваш список? Будет создана копия этой книги со статусом "Черновик".`)) {
      return;
    }

    try {
      const supabase = createClient();
      
      // Get the original book data
      const { data: originalBook, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .eq('id', originalBookId)
        .single();

      if (fetchError || !originalBook) {
        throw new Error('Не удалось найти оригинальную книгу');
      }

      // Generate a new base_url for the copied book
      const timestamp = Date.now();
      const newBaseUrl = `${originalBook.base_url}-copy-${timestamp}`;
      const newTitle = `${originalBook.title} (Копия)`;

      // Create a new book based on the existing one
      const { data: newBook, error: createError } = await supabase
        .from('books')
        .insert({
          title: newTitle,
          description: originalBook.description,
          grade_level: originalBook.grade_level,
          course: originalBook.course,
          category: originalBook.category,
          language: originalBook.language || 'Русский',
          pages_count: originalBook.pages_count,
          price: originalBook.price,
          cover_image: originalBook.cover_image,
          base_url: newBaseUrl,
          author_id: userProfile.id, // Set current user as author
          status: 'Draft' // Start as draft for editing
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Ошибка создания копии книги: ${createError.message}`);
      }

      setSuccess(`Книга "${newTitle}" успешно добавлена как черновик! Вы можете отредактировать ее и отправить на модерацию.`);
      setShowAddExistingModal(false);
      await fetchBooks();

    } catch (err) {
      console.error('Error adding existing book:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при добавлении существующей книги');
    }
  };

  const fetchExistingBooks = async () => {
    if (!userProfile) return;

    setIsLoadingExisting(true);
    try {
      const supabase = createClient();
      
      // Fetch books that are published and not authored by current user
      let query = supabase
        .from('books')
        .select(`
          id,
          title,
          description,
          grade_level,
          course,
          category,
          status,
          author_id,
          base_url,
          language,
          pages_count,
          price,
          cover_image,
          created_at
        `)
        .eq('status', 'Active') // Only active/published books
        .neq('author_id', userProfile.id); // Exclude books by current author

      // Apply search filter if provided
      if (existingBooksSearch.trim()) {
        query = query.or(`title.ilike.%${existingBooksSearch}%,description.ilike.%${existingBooksSearch}%,course.ilike.%${existingBooksSearch}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Get author information for the books
      const authorIds = [...new Set(data?.map(book => book.author_id).filter(Boolean))];
      let authorsData: any[] = [];

      if (authorIds.length > 0) {
        const { data: authors, error: authorsError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', authorIds);
        
        if (!authorsError && authors) {
          authorsData = authors;
        }
      }

      const formattedBooks = (data || []).map(book => {
        const authorData = authorsData.find(author => author.id === book.author_id);
        return {
          ...book,
          author_name: authorData?.display_name || authorData?.email || 'Unknown Author',
          schools_purchased: 0,
          schools_added: 0,
          teachers_added: 0,
          students_added: 0,
          updated_at: book.created_at,
        };
      });

      setExistingBooks(formattedBooks);
    } catch (err) {
      console.error('Error fetching existing books:', err);
      setError('Не удалось загрузить существующие книги');
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // Fetch existing books when modal opens
  useEffect(() => {
    if (showAddExistingModal) {
      fetchExistingBooks();
    }
  }, [showAddExistingModal, existingBooksSearch]);

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
            <>
              <Link href="/dashboard/books/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать книгу
                </Button>
              </Link>
              <Button 
                onClick={() => setShowAddExistingModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Добавить существующую книгу
              </Button>
            </>
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
                        {/* Показываем дополнительную информацию в зависимости от роли */}
                        {userProfile?.role === 'author' && book.author_id === userProfile.id && (
                          <div className="text-xs text-gray-600 mt-1">
                            {getWorkflowStatus(book, 'author')}
                          </div>
                        )}
                        {userProfile?.role === 'moderator' && (
                          <div className="text-xs text-gray-600 mt-1">
                            {getWorkflowStatus(book, 'moderator')}
                          </div>
                        )}
                        {userProfile?.role === 'super_admin' && (
                          <div className="text-xs text-gray-600 mt-1">
                            {getWorkflowStatus(book, 'super_admin')}
                          </div>
                        )}
                        {/* Показываем информацию о модераторе для одобренных книг */}
                        {getModeratorStatusInfo(book) && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            {getModeratorStatusInfo(book)?.message}
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
                      <div className="flex gap-2 flex-wrap">
                        {/* Автор */}
                        {userProfile?.role === 'author' && book.author_id === userProfile.id && (
                          <>
                            {book.status === 'Draft' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleSendToModeration(book.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                📝 Отправить на модерацию
                              </Button>
                            )}
                            {book.status !== 'Draft' && (
                              <div className="text-xs text-gray-500 italic">
                                {getWorkflowStatus(book, 'author')}
                              </div>
                            )}
                          </>
                        )}

                        {/* Модератор */}
                        {userProfile?.role === 'moderator' && (
                          <>
                            {book.status === 'Moderation' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveBook(book.id, book.title, userProfile?.display_name || userProfile?.email || 'Модератор')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✅ Одобрить
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectBook(book.id, book.title, userProfile?.display_name || userProfile?.email || 'Модератор')}
                                >
                                  ❌ Отклонить
                                </Button>
                              </div>
                            )}
                            {book.status === 'Approved' && (
                              <div className="text-xs text-green-600 font-medium">
                                ✅ Одобрено вами - ожидает публикации администратором
                              </div>
                            )}
                            {book.status === 'Active' && (
                              <div className="text-xs text-blue-600 font-medium">
                                📚 Опубликовано и доступно пользователям
                              </div>
                            )}
                            {book.status === 'Draft' && (
                              <div className="text-xs text-gray-500">
                                📝 Черновик - ожидает отправки на модерацию
                              </div>
                            )}
                          </>
                        )}

                        {/* Супер админ */}
                        {userProfile?.role === 'super_admin' && (
                          <>
                            {book.status === 'Moderation' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveBook(book.id, book.title, userProfile?.display_name || userProfile?.email || 'Модератор')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✅ Одобрить
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectBook(book.id, book.title, userProfile?.display_name || userProfile?.email || 'Модератор')}
                                >
                                  ❌ Отклонить
                                </Button>
                              </div>
                            )}
                            {book.status === 'Approved' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleActivateBook(book.id, book.title, userProfile?.display_name || userProfile?.email || 'Суперадмин')}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                🚀 Опубликовать
                              </Button>
                            )}
                            {book.status === 'Active' && (
                              <div className="text-xs text-green-600 font-medium">
                                📚 Опубликовано вами
                              </div>
                            )}
                            {book.status === 'Draft' && (
                              <div className="text-xs text-gray-500">
                                📝 Черновик - ожидает отправки на модерацию
                              </div>
                            )}
                          </>
                        )}

                        {/* Админ школы */}
                        {userProfile?.role === 'school_admin' && book.status === 'Active' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddBookToSchool(book.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ➕ Добавить в библиотеку
                            </Button>
                          </>
                        )}

                        {/* Пользователи школы */}
                        {(userProfile?.role === 'teacher' || userProfile?.role === 'student') && book.status === 'Active' && (
                          <div className="text-xs text-blue-600">
                            📚 Доступно для изучения
                          </div>
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

      {/* Add Existing Book Modal */}
      {showAddExistingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Добавить существующую книгу</h2>
              <button
                onClick={() => setShowAddExistingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Поиск по названию, описанию или предмету..."
                    value={existingBooksSearch}
                    onChange={(e) => setExistingBooksSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Books List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoadingExisting ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Загрузка книг...</span>
                  </div>
                ) : existingBooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {existingBooksSearch ? 'Книги не найдены по вашему запросу' : 'Нет доступных книг для добавления'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingBooks.map((book) => (
                      <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{book.title}</h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{book.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {book.grade_level} класс
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {book.course}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {book.category}
                              </span>
                              {book.language && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {book.language}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              <p>Автор: {book.author_name}</p>
                              <p>Страниц: {book.pages_count || 'Не указано'}</p>
                              {book.price && <p>Цена: {book.price} ₽</p>}
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            {book.cover_image && (
                              <img
                                src={book.cover_image}
                                alt={book.title}
                                className="w-16 h-20 object-cover rounded mb-2"
                              />
                            )}
                            <Button
                              onClick={() => handleAddExistingBook(book.id, book.title)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium min-w-[100px]"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              ДОБАВИТЬ
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                <strong>Внимание:</strong> При добавлении существующей книги будет создана ее копия со статусом "Черновик". 
                Вы сможете отредактировать копию и отправить ее на модерацию.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 