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
import { 
  Filter,
  Plus,
  BookOpen,
  Eye,
  Edit,
  Send,
  Trash2,
  CheckCircle,
  PlayCircle,
  RefreshCw,
  Search,
  X,
  ExternalLink,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBooksWithCorrectClient } from '@/utils/supabase-admin';
import { useRouter } from 'next/navigation';
import BookViewStatsComponent from '@/components/ui/book-view-stats';

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

type RawBookData = {
  id: string;
  base_url: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  status: 'Draft' | 'Moderation' | 'Approved' | 'Active';
  author_id: string;
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

  // States for adding existing books
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [existingBooks, setExistingBooks] = useState<Book[]>([]);
  const [existingBooksSearch, setExistingBooksSearch] = useState('');
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [_existingBooksError, setExistingBooksError] = useState<string | null>(null);

  const router = useRouter();

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
      let authorsData: Array<{ id: string; display_name?: string; email: string }> = [];
      if (booksData && booksData.length > 0) {
        const authorIds = [...new Set(booksData.map((book: RawBookData) => book.author_id).filter(Boolean))];
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
      const formattedBooks = (booksData || []).map((book: RawBookData) => {
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
        draft: formattedBooks.filter((b: Book) => b.status === 'Draft').length,
        moderation: formattedBooks.filter((b: Book) => b.status === 'Moderation').length,
        approved: formattedBooks.filter((b: Book) => b.status === 'Approved').length,
        active: formattedBooks.filter((b: Book) => b.status === 'Active').length,
      });
      
      setBooks(formattedBooks);
      setFilteredBooks(formattedBooks);
      
      // Считаем статистику
      const stats: BookStats = {
        total_books: formattedBooks.length,
        active_books: formattedBooks.filter((b: Book) => b.status === 'Active').length,
        draft_books: formattedBooks.filter((b: Book) => b.status === 'Draft').length,
        moderation_books: formattedBooks.filter((b: Book) => b.status === 'Moderation').length,
        approved_books: formattedBooks.filter((b: Book) => b.status === 'Approved').length,
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

  const handleSendToModeration = async (book: Book) => {
    if (!confirm(`Отправить книгу "${book.title}" на модерацию? После отправки вы не сможете её редактировать.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('books')
        .update({ status: 'Moderation' })
        .eq('id', book.id);

      if (error) {
        throw new Error(`Не удалось отправить книгу на модерацию: ${error.message}`);
      }

      // Refresh books list
      await fetchBooks();
      setSuccess('Книга отправлена на модерацию');
    } catch (error) {
      console.error('Error sending book to moderation:', error);
      setError(error instanceof Error ? error.message : 'Не удалось отправить книгу на модерацию');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBook = async (book: Book) => {
    if (!confirm(`Одобрить книгу "${book.title}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('books')
        .update({ 
          status: 'Approved',
          moderator_id: userProfile?.id // Записываем ID модератора, который одобрил книгу
        })
        .eq('id', book.id);

      if (error) {
        throw new Error(`Не удалось одобрить книгу: ${error.message}`);
      }

      // Refresh books list
      await fetchBooks();
      setSuccess('Книга одобрена и отправлена к супер-админу');
    } catch (error) {
      console.error('Error approving book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось одобрить книгу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateBook = async (book: Book) => {
    if (!confirm(`Активировать книгу "${book.title}"? Она станет доступна для покупки.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('books')
        .update({ status: 'Active' })
        .eq('id', book.id);

      if (error) {
        throw new Error(`Не удалось активировать книгу: ${error.message}`);
      }

      // Refresh books list
      await fetchBooks();
      setSuccess('Книга активирована');
    } catch (error) {
      console.error('Error activating book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось активировать книгу');
    } finally {
      setIsLoading(false);
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
      const { error: createError } = await supabase
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
        });

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

  const fetchExistingBooks = useCallback(async () => {
    if (!userProfile) return;

    try {
      setIsLoadingExisting(true);
      setExistingBooksError(null);
      const supabase = createClient();

      // Fetch only active books that are not already added to the school
      let query = supabase
        .from('books')
        .select('id, title, author_id, grade_level, course, category, price, cover_image, pages_count, language')
        .eq('status', 'Active');
      
      // Fetch school books to exclude them
      if (userProfile.school_id) {
        const { data: schoolBooks } = await supabase
          .from('school_books')
          .select('book_id')
          .eq('school_id', userProfile.school_id);
        
        const excludedBookIds = schoolBooks?.map(sb => sb.book_id) || [];
        
        if (excludedBookIds.length > 0) {
          query = query.not('id', 'in', `(${excludedBookIds.join(',')})`);
        }
      }

      const { data: booksData, error: booksError } = await query.order('title');

      if (booksError) {
        throw new Error(`Ошибка загрузки книг: ${booksError.message}`);
      }

      // Map the data to match the Book type
      const formattedBooks: Book[] = (booksData || []).map(book => ({
        id: book.id,
        base_url: book.id, // Use ID as base_url for existing books
        title: book.title,
        description: '', // Not fetched for existing books modal
        grade_level: book.grade_level,
        course: book.course,
        category: book.category,
        status: 'Active' as const,
        author_id: book.author_id,
        author_name: 'Автор', // Not fetched for this modal
        moderator_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price: book.price,
        cover_image: book.cover_image,
        pages_count: book.pages_count,
        language: book.language,
        schools_purchased: 0,
        schools_added: 0,
        teachers_added: 0,
        students_added: 0,
        downloads_count: 0,
      }));

      setExistingBooks(formattedBooks);
    } catch (err) {
      console.error('Error fetching existing books:', err);
      setError('Не удалось загрузить существующие книги');
    } finally {
      setIsLoadingExisting(false);
    }
  }, [userProfile]);

  // Fetch existing books when modal opens
  useEffect(() => {
    if (showAddExistingModal) {
      fetchExistingBooks();
    }
  }, [showAddExistingModal, fetchExistingBooks]);

  // Action functions
  const handleEditBook = (book: Book) => {
    router.push(`/dashboard/books/${book.base_url}/edit`);
  };

  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Вы уверены, что хотите удалить книгу "${book.title}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (error) {
        throw new Error(`Не удалось удалить книгу: ${error.message}`);
      }

      // Refresh books list
      await fetchBooks();
      setSuccess('Книга успешно удалена');
    } catch (error) {
      console.error('Error deleting book:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить книгу');
    } finally {
      setIsLoading(false);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {userProfile?.role === 'author' ? 'Мои книги' : 'Управление Книгами'}
          </h1>
          {userProfile?.role === 'author' && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Управляйте своими книгами, создавайте новые и отслеживайте их статус
            </p>
          )}
        </div>
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
                        <Link href={`/book/${book.base_url}`} className="hover:text-blue-600 transition-colors">
                          <div className="font-medium flex items-center gap-2">
                            {book.title}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </div>
                        </Link>
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
                      <BookViewStatsComponent bookId={book.id} showDetailedStats={false} className="justify-center" />
                    </TableCell>
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
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBook(book)}
                                  title="Редактировать"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendToModeration(book)}
                                  title="Отправить на модерацию"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBook(book)}
                                  title="Удалить"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveBook(book)}
                                  title="Одобрить"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBook(book)}
                                  title="Отклонить"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveBook(book)}
                                  title="Одобрить"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBook(book)}
                                  title="Отклонить"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {book.status === 'Approved' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleActivateBook(book)}
                                  title="Опубликовать"
                                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {book.status === 'Active' && (
                              <div className="text-xs text-green-600 font-medium">
                                📚 Опубликовано вами
                              </div>
                            )}
                            {book.status === 'Draft' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBook(book)}
                                  title="Редактировать"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBook(book)}
                                  title="Удалить"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                          <div className="flex flex-col gap-2">
                            {/* Основная кнопка чтения */}
                            <Link href={`/read/${book.base_url}`} target="_blank">
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                📖 Читать книгу
                              </Button>
                            </Link>
                            
                            {/* Дополнительная информация */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Доступно для изучения
                              </div>
                            </div>
                            
                            {/* Быстрые действия */}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-7 border-purple-200 text-purple-600 hover:bg-purple-50"
                                onClick={() => {
                                  // Добавим в избранное (можно реализовать позже)
                                  console.log('Add to favorites:', book.id);
                                }}
                              >
                                ⭐ В избранное
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-7 border-orange-200 text-orange-600 hover:bg-orange-50"
                                onClick={() => {
                                  // Поделиться (можно реализовать позже)
                                  navigator.clipboard.writeText(`${window.location.origin}/read/${book.base_url}`);
                                  alert('Ссылка скопирована!');
                                }}
                              >
                                📤 Поделиться
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Публичная ссылка для активных книг (для остальных ролей) */}
                        {book.status === 'Active' && userProfile?.role !== 'teacher' && userProfile?.role !== 'student' && (
                          <Link href={`/read/${book.base_url}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Посмотреть как выглядит книга для публичного доступа"
                              className="h-8 text-green-600 hover:text-green-700"
                            >
                              <Globe className="h-4 w-4 mr-1" />
                              Публично
                            </Button>
                          </Link>
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
                              <Image
                                src={book.cover_image}
                                alt={book.title}
                                width={64}
                                height={80}
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
                <strong>Внимание:</strong> При добавлении существующей книги будет создана ее копия со статусом &ldquo;Черновик&rdquo;. 
                Вы сможете отредактировать копию и отправить ее на модерацию.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 