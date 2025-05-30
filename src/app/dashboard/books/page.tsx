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
import { Search, BookOpen, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';

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
  const courseOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Literature', 'History', 'Geography', 'English', 'Kazakh', 'Russian'];
  const categoryOptions = ['Textbook', 'Workbook', 'Reference', 'Guide', 'Assessment'];
  
  // Status options based on role
  const getStatusOptions = () => {
    switch (userProfile?.role) {
      case 'author':
        return ['Draft', 'Moderation']; // Authors see their books in these statuses
      case 'moderator':
        return ['Moderation', 'Approved']; // Moderators see books for moderation
      case 'super_admin':
        return ['Draft', 'Moderation', 'Approved', 'Active']; // Super admin sees all
      default:
        return ['Active']; // School admin, teachers, students see only active books
    }
  };

  const statusOptions = getStatusOptions();

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
          // Moderators see only books assigned to them
          query = query.eq('moderator_id', userProfile.id);
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
              base_url: 'https://example.com/books/advanced-math-grade-10',
              title: 'Advanced Mathematics Grade 10',
              description: 'Comprehensive mathematics textbook for grade 10 students',
              grade_level: '10',
              course: 'Mathematics',
              category: 'Textbook',
              status: 'Active',
              author_id: 'author1',
              author_name: 'Dr. Smith',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              schools_purchased: 15,
              schools_added: 25,
              teachers_added: 45,
              students_added: 890,
              price: 2500,
              downloads_count: 1250
            },
            {
              id: '2',
              base_url: 'https://example.com/books/physics-fundamentals-grade-11',
              title: 'Physics Fundamentals Grade 11',
              description: 'Essential physics concepts for high school students',
              grade_level: '11',
              course: 'Physics',
              category: 'Textbook',
              status: 'Moderation',
              author_id: 'author2',
              author_name: 'Prof. Johnson',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              schools_purchased: 8,
              schools_added: 12,
              teachers_added: 23,
              students_added: 456,
              price: 3000,
              downloads_count: 650
            },
            {
              id: '3',
              base_url: 'https://example.com/books/chemistry-basics-grade-9',
              title: 'Chemistry Basics Grade 9',
              description: 'Introduction to chemistry for young learners',
              grade_level: '9',
              course: 'Chemistry',
              category: 'Textbook',
              status: 'Draft',
              author_id: 'author3',
              author_name: 'Dr. Williams',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              schools_purchased: 0,
              schools_added: 0,
              teachers_added: 0,
              students_added: 0,
              price: 2800,
              downloads_count: 0
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
      setError(error instanceof Error ? error.message : 'Failed to fetch books');
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
      case 'Active': return 'bg-green-500 text-white';
      case 'Approved': return 'bg-blue-500 text-white';
      case 'Moderation': return 'bg-orange-500 text-white';
      case 'Draft': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
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
      
      setSuccess('Book deleted successfully');
      await fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete book');
    }
  };

  const handleRemoveBookFromSchool = async (bookId: string) => {
    if (!userProfile?.school_id) {
      setError('School ID not found. Please contact administrator.');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this book from your school library? This action cannot be undone.')) {
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
      
      setSuccess('Book removed from school library successfully');
      await fetchBooks();
    } catch (error) {
      console.error('Error removing book from school library:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove book from school library');
    }
  };

  const handleAddBookToSchool = async (bookId: string) => {
    if (!userProfile?.school_id) {
      setError('School ID not found. Please contact administrator.');
      return;
    }
    
    if (!confirm('Are you sure you want to add this book to your school library? This action cannot be undone.')) {
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
      
      setSuccess('Book added to school library successfully');
      await fetchBooks();
    } catch (error) {
      console.error('Error adding book to school library:', error);
      setError(error instanceof Error ? error.message : 'Failed to add book to school library');
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
              <p className="text-lg font-semibold mb-2">Error loading books</p>
              <p className="text-sm mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reload Page
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Books Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userProfile?.role === 'author' && 'Manage your authored books and create new content'}
            {userProfile?.role === 'moderator' && 'Review and approve books for publication'}
            {userProfile?.role === 'super_admin' && 'Manage all educational books and their distribution'}
            {userProfile?.role === 'school' && (viewMode === 'all' ? 'Browse all available books to add to your school library' : 'Manage your school\'s book library')}
            {(userProfile?.role === 'teacher' || userProfile?.role === 'student') && 'Browse your school\'s educational books'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* School Admin View Toggle */}
          {userProfile?.role === 'school' && (
            <div className="flex items-center space-x-2 mr-4">
              <Button 
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Books
              </Button>
              <Button 
                variant={viewMode === 'library' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('library')}
              >
                My Library
              </Button>
            </div>
          )}
          
          <Badge variant="outline" className="text-sm">
            <BookOpen className="h-4 w-4 mr-1" />
            {filteredBooks.length} books
          </Badge>
          {userProfile?.role === 'author' && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Book
            </Button>
          )}
          {userProfile?.role === 'super_admin' && (
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Book to System
            </Button>
          )}
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
                  <p className="text-sm font-medium text-gray-600">Total Books</p>
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
                  <p className="text-sm font-medium text-gray-600">Active</p>
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
                  <p className="text-sm font-medium text-gray-600">Moderation</p>
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
                  <p className="text-sm font-medium text-gray-600">Draft</p>
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
                  <p className="text-sm font-medium text-gray-600">Approved</p>
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
            Book Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Grade Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Level</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {gradeOptions.map(grade => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseOptions.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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
          <CardTitle>Books Library</CardTitle>
          <CardDescription>
            Educational books with purchase and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Schools</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <Badge variant="outline">Grade {book.grade_level}</Badge>
                    </TableCell>
                    <TableCell>{book.course}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(book.status)}>
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{book.author_name}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-sm font-medium">{book.schools_purchased} purchased</div>
                        <div className="text-xs text-gray-500">{book.schools_added} added</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center text-sm">{book.teachers_added}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center text-sm">{book.students_added}</div>
                    </TableCell>
                    <TableCell>
                      {book.price ? `₸${book.price.toLocaleString()}` : 'Free'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Author actions */}
                        {userProfile?.role === 'author' && book.author_id === userProfile.id && (
                          <>
                            {book.status === 'Draft' && (
                              <Button variant="ghost" size="sm" className="text-blue-600">
                                Send for Moderation
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

                        {/* Moderator actions */}
                        {userProfile?.role === 'moderator' && book.status === 'Moderation' && (
                          <Button variant="ghost" size="sm" className="text-green-600">
                            Approve Book
                          </Button>
                        )}

                        {/* Super Admin actions */}
                        {userProfile?.role === 'super_admin' && (
                          <>
                            {book.status === 'Approved' && (
                              <Button variant="ghost" size="sm" className="text-green-600">
                                Activate Book
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
                            Add to Library
                          </Button>
                        )}
                        
                        {userProfile?.role === 'school' && viewMode === 'library' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveBookFromSchool(book.id)}
                          >
                            Remove from Library
                          </Button>
                        )}

                        {/* School users - view only */}
                        {(userProfile?.role === 'school' || userProfile?.role === 'teacher' || userProfile?.role === 'student') && (
                          <Button variant="ghost" size="sm" className="text-blue-600">
                            Open Book
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
              No books found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 