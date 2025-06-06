import { createClient } from '@/utils/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, User, Calendar, Globe, Star } from 'lucide-react';
import Image from 'next/image';
import BookReader from '@/components/ui/book-reader';

// Публичная страница для чтения книг (без авторизации)
export default async function PublicBookReadPage({ params }: { params: Promise<{ base_url: string }> }) {
  const { base_url } = await params;

  console.log('🔍 PublicBookReadPage - Searching for book with base_url:', base_url);

  const supabase = createClient();
  
  // Fetch only ACTIVE books for public access - simplified query
  const { data: book, error } = await supabase
    .from('books')
    .select(`
      *
    `)
    .eq('base_url', base_url)
    .eq('status', 'Active') // Only published/active books are publicly available
    .single();

  console.log('📚 PublicBookReadPage - Query result:', { book: !!book, error: error?.message });

  if (error || !book) {
    console.log('❌ PublicBookReadPage - Book not found, calling notFound()');
    notFound();
  }

  console.log('✅ PublicBookReadPage - Book found:', book.title);

  // Fetch author info separately if needed
  let authorInfo = null;
  if (book.author_id) {
    const { data: author } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', book.author_id)
      .single();
    authorInfo = author;
  }

  // Fetch chapters if they exist
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .eq('status', 'Active') // Only active chapters
    .order('order_index', { ascending: true });

  // Demo chapters for books without real chapters
  const demoChapters = [
    {
      id: 'intro',
      title: `Введение в "${book.title}"`,
      content: `
        <h1>Добро пожаловать!</h1>
        <p>Эта книга доступна для <strong>свободного чтения</strong> на нашей образовательной платформе.</p>
        
        <h2>О книге "${book.title}"</h2>
        <p>${book.description || 'Описание книги недоступно.'}</p>
        
        <h2>Информация для читателей</h2>
        <ul>
          <li><strong>Класс:</strong> ${book.grade_level || 'Не указан'}</li>
          <li><strong>Предмет:</strong> ${book.course || 'Не указан'}</li>
          <li><strong>Категория:</strong> ${book.category || 'Общая'}</li>
          <li><strong>Язык:</strong> ${book.language || 'Русский'}</li>
        </ul>
        
        <blockquote>
          "Образование - это инвестиция в будущее. Чтение - ключ к знаниям."
        </blockquote>
        
        <hr>
        
        <h2>Как пользоваться этой книгой</h2>
        <p>Используйте панель навигации сверху для:</p>
        <ul>
          <li>📖 <strong>Оглавление</strong> - быстрый переход между главами</li>
          <li>🔍 <strong>Увеличение/уменьшение шрифта</strong> - настройка удобного размера текста</li>
          <li>🎨 <strong>Темы оформления</strong> - светлая, тёмная или сепия</li>
          <li>📝 <strong>Настройки текста</strong> - выбор шрифта и выравнивания</li>
        </ul>
      `,
      order: 1
    },
    {
      id: 'chapter1',
      title: 'Глава 1: Основы изучения',
      content: `
        <h1>Глава 1: Основы изучения</h1>
        
        <p>В этой главе мы изучим фундаментальные принципы, которые помогут эффективно усвоить материал.</p>
        
        <h2>1.1 Подготовка к изучению</h2>
        <p>Перед началом изучения важно:</p>
        <ol>
          <li>Создать комфортную обстановку для чтения</li>
          <li>Настроить оптимальное освещение</li>
          <li>Выбрать удобные параметры отображения текста</li>
          <li>Запланировать время для изучения</li>
        </ol>
        
        <div style="background: #f0f8ff; border-left: 4px solid #0066cc; padding: 1em; margin: 1em 0;">
          <strong>💡 Совет:</strong> Делайте перерывы каждые 25-30 минут для лучшего усвоения материала.
        </div>
        
        <h2>1.2 Методы эффективного чтения</h2>
        <p>Для максимальной пользы от чтения рекомендуется:</p>
        
        <ul>
          <li><strong>Активное чтение</strong> - задавайте себе вопросы по тексту</li>
          <li><strong>Конспектирование</strong> - записывайте ключевые мысли</li>
          <li><strong>Практическое применение</strong> - используйте полученные знания</li>
          <li><strong>Повторение</strong> - возвращайтесь к изученному материалу</li>
        </ul>
        
        <h2>1.3 Практические упражнения</h2>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1em; margin: 1em 0;">
          <strong>Задание 1.1:</strong> Опишите своими словами главную идею этой главы.
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1em; margin: 1em 0;">
          <strong>Задание 1.2:</strong> Составьте план своего изучения данной книги.
        </div>
      `,
      order: 2
    },
    {
      id: 'chapter2',
      title: 'Глава 2: Углубленное изучение',
      content: `
        <h1>Глава 2: Углубленное изучение</h1>
        
        <p>Теперь, когда основы усвоены, перейдем к более детальному изучению предмета.</p>
        
        <h2>2.1 Теоретические основы</h2>
        <p>Теория предоставляет нам фундамент для понимания практических аспектов.</p>
        
        <div style="border: 2px solid #e2e8f0; padding: 1.5em; margin: 1em 0; background: #f8fafc;">
          <h3>📚 Ключевые понятия:</h3>
          <ul>
            <li><strong>Концепция А:</strong> Базовое определение и применение</li>
            <li><strong>Концепция Б:</strong> Расширенное понимание темы</li>
            <li><strong>Концепция В:</strong> Интегрированный подход</li>
          </ul>
        </div>
        
        <h2>2.2 Практические примеры</h2>
        <p>Рассмотрим конкретные примеры применения изученных концепций:</p>
        
        <div style="background: #f0fff4; border-left: 4px solid #22c55e; padding: 1em; margin: 1em 0;">
          <strong>Пример 2.1:</strong> Практическое применение концепции А в реальных условиях показывает эффективность подхода...
        </div>
        
        <div style="background: #f0fff4; border-left: 4px solid #22c55e; padding: 1em; margin: 1em 0;">
          <strong>Пример 2.2:</strong> Интеграция различных подходов позволяет достичь синергетического эффекта...
        </div>
        
        <h2>2.3 Самостоятельная работа</h2>
        <p>Для закрепления материала выполните следующие задания:</p>
        
        <ol>
          <li>Проанализируйте один из приведенных примеров</li>
          <li>Найдите дополнительные источники по теме</li>
          <li>Составьте собственный пример применения</li>
          <li>Обсудите результаты с коллегами или преподавателем</li>
        </ol>
        
        <hr>
        
        <div class="poetry" style="text-align: center; font-style: italic; margin: 2em 0; color: #6b7280;">
          Знание без применения — как семя без воды.<br>
          Только практика превращает теорию в мудрость.
        </div>
      `,
      order: 3
    }
  ];

  // Prepare data for BookReader
  const bookReaderData = {
    id: book.id,
    title: book.title,
    chapters: chapters && chapters.length > 0 
      ? chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '<p>Содержимое главы недоступно.</p>',
          order: chapter.order_index || 0
        }))
      : demoChapters
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Public Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  На главную
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {book.title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Globe className="h-3 w-3 mr-1" />
                Публичная
              </Badge>
              <Badge variant="outline">
                <BookOpen className="h-3 w-3 mr-1" />
                {book.category || 'Учебник'}
              </Badge>
              {book.grade_level && (
                <Badge variant="secondary">
                  {book.grade_level} класс
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Book Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="h-5 w-5 mr-2" />
                  О книге
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {book.cover_image && (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={book.cover_image}
                      alt={book.title}
                      width={300}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {book.title}
                  </h3>
                  {book.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {book.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {authorInfo?.display_name || authorInfo?.email || 'Автор неизвестен'}
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
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(book.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Свободный доступ
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      Опубликовано
                    </Badge>
                    {book.grade_level && (
                      <Badge variant="secondary" className="text-xs">
                        {book.grade_level} класс
                      </Badge>
                    )}
                    {book.course && (
                      <Badge variant="outline" className="text-xs">
                        {book.course}
                      </Badge>
                    )}
                    {book.category && (
                      <Badge variant="default" className="text-xs">
                        {book.category}
                      </Badge>
                    )}
                    {book.language && (
                      <Badge variant="secondary" className="text-xs">
                        {book.language}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Public access notice */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-xs font-medium text-green-800">
                        Свободный доступ
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Эта книга доступна для чтения всем пользователям интернета без регистрации.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Reader */}
          <div className="lg:col-span-4">
            <BookReader 
              bookData={bookReaderData}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Footer for public page */}
      <footer className="bg-white dark:bg-gray-800 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Образовательная платформа. Книга "{book.title}" доступна для свободного чтения.
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/register" className="text-sm text-blue-600 hover:text-blue-700">
                Регистрация
              </Link>
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 