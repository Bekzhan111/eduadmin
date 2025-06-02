'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Save, Upload, Send, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

type BookForm = {
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  base_url: string;
  price: number;
  cover_image: string;
  language: string;
  pages_count: number;
  isbn: string;
  publisher: string;
  publication_date: string;
};

export default function CreateBookPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade_level: '',
    course: '',
    category: '',
    language: 'Русский',
    pages_count: '',
    price: '',
    cover_image: '',
    base_url: ''
  });

  // Available options
  const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const courseOptions = [
    'Математика', 'Физика', 'Химия', 'Биология', 'Литература', 
    'История', 'География', 'Английский', 'Казахский', 'Русский',
    'Информатика', 'Обществознание', 'Искусство', 'Физкультура'
  ];
  const categoryOptions = ['Учебник', 'Рабочая тетрадь', 'Справочник', 'Руководство', 'Методичка'];
  const languageOptions = ['Русский', 'Казахский', 'Английский'];

  const generateBaseUrl = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-generate base_url from title
      if (field === 'title') {
        updated.base_url = generateBaseUrl(value)
      }
      
      return updated
    })
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Название книги обязательно'
    if (!formData.description.trim()) return 'Описание книги обязательно'
    if (!formData.grade_level) return 'Уровень класса обязателен'
    if (!formData.course.trim()) return 'Курс обязателен'
    if (!formData.category.trim()) return 'Категория обязательна'
    if (!formData.pages_count || parseInt(formData.pages_count) <= 0) return 'Количество страниц должно быть больше 0'
    if (!formData.price || parseFloat(formData.price) < 0) return 'Цена не может быть отрицательной'
    
    // Validate that price can be converted to integer (no decimals for now)
    const priceValue = parseFloat(formData.price);
    if (!Number.isInteger(priceValue)) {
      return 'Цена должна быть целым числом (без копеек). Например: 5000, 2800';
    }
    
    return null
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userProfile) {
      setError('Пользователь не авторизован');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      
      // Check if base_url is unique
      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .eq('base_url', formData.base_url)
        .single();

      if (existingBook) {
        setError('Книга с таким URL уже существует. Измените название.');
        setIsLoading(false);
        return;
      }

      // Create the book
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          grade_level: formData.grade_level,
          course: formData.course.trim(),
          category: formData.category.trim(),
          language: formData.language,
          pages_count: parseInt(formData.pages_count),
          price: Math.round(parseFloat(formData.price)), // Convert to integer for database
          cover_image: formData.cover_image.trim() || null,
          base_url: formData.base_url,
          author_id: userProfile.id,
          status: 'Moderation' // Set status to Moderation for approval workflow
        })
        .select()
        .single();

      if (bookError) {
        throw new Error(bookError.message);
      }

      setSuccess('Книга успешно создана и отправлена на модерацию!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        grade_level: '',
        course: '',
        category: '',
        language: 'Русский',
        pages_count: '',
        price: '',
        cover_image: '',
        base_url: ''
      });

      // Redirect to books list after a short delay
      setTimeout(() => {
        router.push('/dashboard/books');
      }, 2000);

    } catch (err) {
      console.error('Error creating book:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании книги');
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем, что пользователь - автор
  if (userProfile?.role !== 'author') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Доступ запрещен</h1>
          <p className="text-gray-600 mt-2">Только авторы могут создавать книги.</p>
          <Link href="/dashboard">
            <Button className="mt-4">
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
            Создание новой книги
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Заполните форму для создания новой книги и отправки на модерацию
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Информация о книге</CardTitle>
            <CardDescription>
              После создания книга будет отправлена на модерацию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Название книги *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Введите название книги"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Описание книги *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Краткое описание содержания книги"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="grade_level">Класс *</Label>
                  <Select value={formData.grade_level} onValueChange={(value) => handleInputChange('grade_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите класс" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade} класс
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course">Курс/Предмет *</Label>
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    placeholder="Математика, Физика, История..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Язык</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(language => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pages_count">Количество страниц *</Label>
                  <Input
                    id="pages_count"
                    type="number"
                    min="1"
                    value={formData.pages_count}
                    onChange={(e) => handleInputChange('pages_count', e.target.value)}
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Цена (тенге) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="2500.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="cover_image">Ссылка на обложку (необязательно)</Label>
                  <Input
                    id="cover_image"
                    value={formData.cover_image}
                    onChange={(e) => handleInputChange('cover_image', e.target.value)}
                    placeholder="https://example.com/book-cover.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="base_url">URL книги</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => handleInputChange('base_url', e.target.value)}
                    placeholder="matematika-5-klass"
                    className="bg-gray-50 dark:bg-gray-800"
                    readOnly
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Автоматически генерируется из названия книги
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/books')}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Создать и отправить на модерацию
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 