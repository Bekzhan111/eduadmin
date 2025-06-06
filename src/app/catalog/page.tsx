import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, User, Search, Globe, Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';

// Публичный каталог книг (без авторизации)
export default async function PublicCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    grade?: string;
    course?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params?.search || '';
  const category = params?.category || '';
  const grade = params?.grade || '';
  const course = params?.course || '';

  const supabase = createClient();
  
  // Fetch only ACTIVE books for public catalog
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
      cover_image,
      pages_count,
      language,
      created_at,
      author_id
    `)
    .eq('status', 'Active') // Only published books
    .order('created_at', { ascending: false });

  // Apply filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,course.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (grade) {
    query = query.eq('grade_level', grade);
  }
  if (course) {
    query = query.ilike('course', `%${course}%`);
  }

  const { data: books, error } = await query;

  if (error) {
    console.error('Error fetching books:', error);
  }

  // Debug: log the results
  console.log('📚 Catalog debug - Books found:', books?.length || 0);
  console.log('📚 Catalog debug - Error:', error);
  console.log('📚 Catalog debug - First book:', books?.[0]);

  // Get unique values for filters
  const { data: filterData } = await supabase
    .from('books')
    .select('category, grade_level, course')
    .eq('status', 'Active');

  const categories = [...new Set(filterData?.map(book => book.category).filter(Boolean))] as string[];
  const grades = [...new Set(filterData?.map(book => book.grade_level).filter(Boolean))] as string[];
  const courses = [...new Set(filterData?.map(book => book.course).filter(Boolean))] as string[];

  const formattedBooks = books || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Public Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  На главную
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                📚 Каталог книг
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Globe className="h-3 w-3 mr-1" />
                Свободный доступ
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formattedBooks.length} книг
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Образовательная библиотека
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Бесплатный доступ к качественным учебным материалам. 
            Читайте, изучайте и расширяйте свои знания без ограничений.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Поиск и фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Поиск</label>
                  <Input
                    name="search"
                    placeholder="Название книги, курс..."
                    defaultValue={search}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Категория</label>
                  <select 
                    name="category" 
                    defaultValue={category}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Все категории</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Класс</label>
                  <select 
                    name="grade" 
                    defaultValue={grade}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Все классы</option>
                    {grades.map(gr => (
                      <option key={gr} value={gr}>{gr}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Предмет</label>
                  <select 
                    name="course" 
                    defaultValue={course}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Все предметы</option>
                    {courses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Найти книги
                </Button>
                <Link href="/catalog">
                  <Button variant="outline">
                    Сбросить фильтры
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Books Grid */}
        {formattedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  {/* Book Cover */}
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                    {book.cover_image ? (
                      <Image
                        src={book.cover_image}
                        alt={book.title}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900">
                        <BookOpen className="h-16 w-16 text-blue-500 dark:text-blue-300" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {book.title}
                      </h3>
                      {book.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {book.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Автор
                        </span>
                      </div>
                      
                      {book.pages_count && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {book.pages_count} страниц
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        <Star className="h-3 w-3 mr-1" />
                        Опубликовано
                      </Badge>
                      {book.grade_level && (
                        <Badge variant="secondary" className="text-xs">
                          {book.grade_level} класс
                        </Badge>
                      )}
                      {book.category && (
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link href={`/read/${book.base_url}`} className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Читать книгу
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
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
                {search || category || grade || course 
                  ? 'Попробуйте изменить критерии поиска или сбросить фильтры.'
                  : 'В каталоге пока нет доступных книг.'}
              </p>
              {(search || category || grade || course) && (
                <Link href="/catalog">
                  <Button variant="outline">
                    Сбросить фильтры
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 dark:bg-blue-900/20 py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Присоединяйтесь к образовательному сообществу
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Зарегистрируйтесь, чтобы получить доступ к дополнительным функциям, 
            отслеживанию прогресса и персональным рекомендациям.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Зарегистрироваться
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Войти в систему
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                О платформе
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Бесплатная образовательная платформа с открытым доступом к качественным учебным материалам.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Статистика
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>📚 {formattedBooks.length} доступных книг</div>
                <div>🌍 Свободный доступ</div>
                <div>🆓 Полностью бесплатно</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Навигация
              </h3>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  Главная страница
                </Link>
                <Link href="/catalog" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  Каталог книг
                </Link>
                <Link href="/register" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  Регистрация
                </Link>
                <Link href="/login" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  Вход в систему
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 Образовательная платформа. Все книги доступны для свободного чтения.
          </div>
        </div>
      </footer>
    </div>
  );
} 