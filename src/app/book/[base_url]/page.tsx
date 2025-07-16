import { createClient } from '@/utils/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  User, 
  Calendar,
  ExternalLink,
  Download,
  Share2,
  Globe,
  FileText
} from 'lucide-react';
import Image from 'next/image';

export default async function BookPage({ params }: { params: Promise<{ base_url: string }> }) {
  const { base_url } = await params;

  const supabase = createClient();
  
  // Fetch book data with view count
  const { data: book, error } = await supabase
    .from('books')
    .select(`
      *,
      users:author_id (display_name, email)
    `)
    .eq('base_url', base_url)
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
                {book.title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={book.status === 'Active' ? 'default' : 'outline'}>
                <BookOpen className="h-3 w-3 mr-1" />
                {book.status === 'Draft' ? 'Черновик' : 
                 book.status === 'Moderation' ? 'Модерация' : 
                 book.status === 'Approved' ? 'Одобрено' : 
                 'Активная книга'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book Hero Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {book.cover_image ? (
                  <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={book.cover_image}
                      alt={book.title}
                      width={400}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="h-24 w-24 text-white" />
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <Link href={`/books/${base_url}`}>
                    <Button className="w-full" size="lg">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Читать книгу
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Поделиться
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Title and metadata */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.grade_level && (
                      <Badge variant="secondary">
                        {book.grade_level} класс
                      </Badge>
                    )}
                    {book.category && (
                      <Badge variant="outline">
                        {book.category}
                      </Badge>
                    )}
                    {book.language && (
                      <Badge variant="default">
                        <Globe className="h-3 w-3 mr-1" />
                        {book.language}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {book.title}
                  </h1>
                  
                  {book.course && (
                    <p className="text-xl text-blue-600 dark:text-blue-400 mb-4">
                      {book.course}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{book.users?.display_name || book.users?.email || 'Неизвестный автор'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{book.pages_count} страниц</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(book.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                      {book.description}
                    </p>
                  )}
                </div>

                {/* Book Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Детали книги
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {book.isbn && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">ISBN</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{book.isbn}</div>
                        </div>
                      )}
                      {book.publisher && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Издательство</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{book.publisher}</div>
                        </div>
                      )}
                      {book.publication_date && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Дата публикации</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(book.publication_date).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      )}
                      {book.file_size && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Размер файла</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {(book.file_size / 1024 / 1024).toFixed(1)} МБ
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>


        {/* Book Content Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Предварительный просмотр</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📚 Содержимое книги &ldquo;{book.title}&rdquo;
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Здесь будет отображаться предварительный просмотр содержимого книги.
                  В полной версии может быть:
                </p>
                <ul className="mt-3 space-y-1 text-blue-800 dark:text-blue-200">
                  <li>• PDF-вьювер для просмотра учебника</li>
                  <li>• Интерактивные упражнения и задания</li>
                  <li>• Видео и аудио материалы</li>
                  <li>• Тесты и проверочные работы</li>
                </ul>
                
                <div className="mt-4">
                  <Link href={`/books/${base_url}`}>
                    <Button>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть для чтения
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 