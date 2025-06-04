import { createClient } from '@/utils/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, User, Calendar } from 'lucide-react';
import Image from 'next/image';

export default async function BookReadPage({ params }: { params: { base_url: string } }) {
  const { base_url } = params;

  const supabase = createClient();
  
  // Fetch book data
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
                Чтение книги
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                <BookOpen className="h-3 w-3 mr-1" />
                Активная книга
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Book Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Информация о книге
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {book.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {book.users?.display_name || book.users?.email || 'Неизвестный автор'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {book.pages_count} страниц
                      </span>
                    </div>
                    
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

          {/* Book Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  {book.title}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  {book.course} • {book.grade_level} класс
                </p>
              </CardHeader>
              <CardContent>
                {/* This is where the actual book content would be rendered */}
                <div className="prose max-w-none dark:prose-invert">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📚 Содержимое книги
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200">
                      Здесь будет отображаться содержимое книги &ldquo;{book.title}&rdquo;.
                      В реальной системе здесь может быть:
                    </p>
                    <ul className="mt-3 space-y-1 text-blue-800 dark:text-blue-200">
                      <li>• PDF-вьювер для просмотра учебника</li>
                      <li>• Интерактивные упражнения и задания</li>
                      <li>• Видео и аудио материалы</li>
                      <li>• Тесты и проверочные работы</li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Глава 1: Введение
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Это демонстрационный контент для книги &ldquo;{book.title}&rdquo;. 
                        В реальной образовательной системе здесь бы отображался 
                        фактический контент учебника, включая текст, изображения, 
                        схемы и интерактивные элементы.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Основные темы
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            Тема 1
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Основные понятия и определения
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            Тема 2
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Практические примеры и упражнения
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            Тема 3
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Контрольные вопросы и задания
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            Тема 4
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Дополнительные материалы
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Заключение
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Данная страница демонстрирует, как пользователи смогут 
                        читать активированные книги после прохождения полного 
                        цикла модерации: Автор → Модератор → Суперадмин → Публикация.
                      </p>
                    </section>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 