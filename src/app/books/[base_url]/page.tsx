import { createClient } from '@/utils/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, User, Calendar } from 'lucide-react';
import Image from 'next/image';
import BookReader from '@/components/ui/book-reader';

export default async function BookReadPage({ params }: { params: Promise<{ base_url: string }> }) {
  const { base_url } = await params;

  const supabase = createClient();
  
  // Fetch book data with chapters if available
  const { data: book, error } = await supabase
    .from('books')
    .select(`
      *,
      users:author_id (display_name, email)
    `)
    .eq('base_url', base_url)
    .eq('status', 'Active') // Only show active books
    .single();

  if (error || !book) {
    notFound();
  }

  // Fetch chapters if they exist (предполагаем, что у нас есть таблица chapters)
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .order('order_index', { ascending: true });

  // Создаем демонстрационный контент если нет реальных глав
  const demoChapters = [
    {
      id: 'intro',
      title: 'Введение',
      content: `
        <h1>Введение в ${book.title}</h1>
        <p>Добро пожаловать в изучение курса <strong>"${book.title}"</strong> для ${book.grade_level} класса.</p>
        <p>Этот учебник охватывает основные темы курса и предоставляет систематический подход к изучению материала.</p>
        
        <h2>Цели обучения</h2>
        <p>По завершении изучения данного курса студенты должны:</p>
        <ul>
          <li>Понимать основные концепции и принципы</li>
          <li>Применять полученные знания на практике</li>
          <li>Развить критическое мышление в данной области</li>
          <li>Подготовиться к дальнейшему изучению предмета</li>
        </ul>
        
        <blockquote>
          "Образование - это самое мощное оружие, которым можно изменить мир." - Нельсон Мандела
        </blockquote>
      `,
      order: 1
    },
    {
      id: 'chapter1',
      title: 'Глава 1: Основы',
      content: `
        <h1>Глава 1: Основные понятия</h1>
        
        <p>В этой главе мы рассмотрим фундаментальные концепции, которые станут основой для дальнейшего изучения материала.</p>
        
        <h2>1.1 Определения</h2>
        <p>Прежде чем погрузиться в детали, важно понимать основные термины и определения:</p>
        
        <div class="definition-box" style="border: 1px solid #ddd; padding: 1em; margin: 1em 0; background: #f9f9f9;">
          <strong>Определение 1.1:</strong> Основная концепция - это...
        </div>
        
        <h2>1.2 Примеры</h2>
        <p>Рассмотрим несколько примеров для лучшего понимания:</p>
        
        <div style="margin: 1em 0; padding: 1em; background: #f0f8ff; border-left: 4px solid #0066cc;">
          <strong>Пример 1:</strong> Практическое применение основной концепции в реальной жизни...
        </div>
        
        <h2>1.3 Упражнения</h2>
        <p>Для закрепления материала выполните следующие упражнения:</p>
        <ol>
          <li>Объясните основную концепцию своими словами</li>
          <li>Приведите три собственных примера</li>
          <li>Решите задачи в конце главы</li>
        </ol>
      `,
      order: 2
    },
    {
      id: 'chapter2',
      title: 'Глава 2: Практическое применение',
      content: `
        <h1>Глава 2: Практическое применение</h1>
        
        <p>Теперь, когда мы изучили основы, перейдем к практическому применению полученных знаний.</p>
        
        <h2>2.1 Методология</h2>
        <p>Для эффективного применения теоретических знаний рекомендуется использовать следующую методологию:</p>
        
        <ol>
          <li><strong>Анализ задачи</strong> - внимательно изучите условия</li>
          <li><strong>Планирование решения</strong> - составьте план действий</li>
          <li><strong>Реализация</strong> - выполните запланированные шаги</li>
          <li><strong>Проверка результатов</strong> - убедитесь в правильности решения</li>
        </ol>
        
        <h2>2.2 Практические задания</h2>
        
        <div style="margin: 1em 0; padding: 1em; background: #fff3cd; border: 1px solid #ffeaa7;">
          <strong>Задание 2.1:</strong> Используя изученные в первой главе концепции, решите следующую практическую задачу...
        </div>
        
        <h2>2.3 Самостоятельная работа</h2>
        <p>Выберите одну из предложенных тем для самостоятельного исследования:</p>
        <ul>
          <li>История развития данной области знаний</li>
          <li>Современные тенденции и направления</li>
          <li>Влияние технологий на развитие предмета</li>
        </ul>
        
        <hr>
        <p class="poetry">
          Знание - сила,<br>
          Практика - мастерство,<br>
          Вместе они творят чудеса.
        </p>
      `,
      order: 3
    }
  ];

  // Подготавливаем данные для BookReader
  const bookReaderData = {
    id: book.id,
    title: book.title,
    chapters: chapters && chapters.length > 0 
      ? chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '<p>Содержимое главы не найдено.</p>',
          order: chapter.order_index || 0
        }))
      : demoChapters
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/books">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к книгам
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {book.title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
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
                        {book.users?.display_name || book.users?.email || 'Неизвестный автор'}
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
                  </div>
                  
                  
                  <div className="flex flex-wrap gap-2 mt-4">
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
    </div>
  );
} 