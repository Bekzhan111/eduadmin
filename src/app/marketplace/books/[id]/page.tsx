import { createClient } from '@/utils/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { Calendar, Globe, FileText, Download, Users, School, ArrowLeft, ShoppingCart } from 'lucide-react';
import Image from "next/image";

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
  file_size: number;
  isbn: string;
  publisher: string;
  publication_date: string;
  schools_purchased: number;
  downloads_count: number;
  created_at: string;
}

async function getBook(id: string): Promise<Book | null> {
  const supabase = createClient();
  
  try {
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('status', 'Active')
      .single();

    if (error) {
      console.error('Error fetching book:', error);
      return null;
    }

    return book;
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/marketplace" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к книгам
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="md:w-1/2">
                  <Image
                    src={book.cover_image || "/placeholder-book.jpg"}
                    alt={book.title}
                    width={400}
                    height={600}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      ${book.price || 'Бесплатно'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Разовая покупка
                    </div>
                  </div>

                  <Link href={`/marketplace/books/${book.id}/purchase`}>
                    <Button size="lg" className="w-full">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Купить книгу
                    </Button>
                  </Link>

                  <div className="text-center">
                    <Link href="/bulk-purchase" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                      Нужны оптовые цены? Свяжитесь с нами
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {book.grade_level && (
                  <Badge variant="secondary">
                    {book.grade_level}
                  </Badge>
                )}
                {book.category && (
                  <Badge variant="outline">
                    {book.category}
                  </Badge>
                )}
                {book.language && book.language !== 'English' && (
                  <Badge variant="default">
                    {book.language}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {book.title}
              </h1>

              {book.course && (
                <p className="text-xl text-blue-600 dark:text-blue-400 mb-4">
                  {book.course}
                </p>
              )}

              {book.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>

            {/* Book Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Статистика книги
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {book.schools_purchased}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Школ
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {book.downloads_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Загрузок
                    </div>
                  </div>
                  {book.pages_count && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {book.pages_count}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Страниц
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Технические детали
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {book.isbn && (
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ISBN
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {book.isbn}
                      </div>
                    </div>
                  )}
                  
                  {book.publisher && (
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Издательство
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {book.publisher}
                      </div>
                    </div>
                  )}
                  
                  {book.publication_date && (
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Дата публикации
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(book.publication_date)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Язык
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {book.language || 'Английский'}
                    </div>
                  </div>
                  
                  {book.file_size && (
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Размер файла
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        {formatFileSize(book.file_size)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Добавлено на платформу
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(book.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>О этой книге</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Эта образовательная книга предназначена для учащихся {book.grade_level} 
                    {book.course && ` изучающих ${book.course}`}. 
                    {book.category && ` Она относится к категории ${book.category}`} 
                    и предоставляет комплексные учебные материалы для улучшения понимания предмета.
                  </p>
                  
                  {book.schools_purchased > 0 && (
                    <p>
                      Этой книге доверяют {book.schools_purchased} образовательных учреждений 
                      и она была загружена {book.downloads_count} раз, что делает её проверенным ресурсом 
                      для эффективного обучения.
                    </p>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <School className="h-4 w-4 inline mr-1" />
                    Подходит как для индивидуального обучения, так и для использования в классе. 
                    Школы могут приобрести оптовые лицензии для своих учеников.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
} 