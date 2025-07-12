'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BookOpen, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookImport } from '@/components/book-editor/BookImport';
import { BookExportData } from '@/components/book-editor/types';

function CreateBookPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
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
    cover_image: '',
    base_url: ''
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importedBookData, setImportedBookData] = useState<BookExportData | null>(null);

  // Available options
  const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const categoryOptions = ['Учебник', 'Рабочая тетрадь', 'Справочник', 'Руководство', 'Методичка'];
  const languageOptions = ['Русский', 'Казахский', 'Английский'];
  const courseOptions = [
    'английский язык',
    'биология',
    'география',
    'детская литература',
    'дошкольное образование',
    'изобразительное искусство/художественный труд',
    'иностранный язык',
    'информатика',
    'история',
    'казахский язык',
    'литература',
    'литературное чтение',
    'математика',
    'музыкальное образование',
    'немецкий язык',
    'обществоведение',
    'Познание мира',
    'природа и человек',
    'природоведение/естествознание',
    'профессиональное образование',
    'разное',
    'религиозное образование',
    'робототехника',
    'родной язык',
    'русский язык',
    'русский язык и литература',
    'тематическое обучение',
    'технология',
    'трудовое обучение',
    'физика',
    'физкультура',
    'философия',
    'французский язык',
    'химия',
    'художественная литература',
    'цифровая грамотность',
    'человек и общество',
    'человековедение',
    'шведский язык',
    'юношеская литература',
  ];

  const transliterateCyrillic = (text: string): string => {
    const cyrillicToLatin: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.split('').map(char => cyrillicToLatin[char] || char).join('');
  };

  const generateBaseUrl = (title: string) => {
    return transliterateCyrillic(title)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Only allow Latin letters, numbers, and spaces
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5МБ');
      return;
    }

    setCoverImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setError(null);
    setSuccess(null);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `book-covers/${fileName}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Ошибка загрузки: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Название книги обязательно'
    if (!formData.description.trim()) return 'Описание книги обязательно'
    if (!formData.grade_level) return 'Уровень класса обязателен'
    if (!formData.course.trim()) return 'Курс обязателен'
    if (!formData.category.trim()) return 'Категория обязательна'
    if (!coverImageFile && !formData.cover_image.trim()) return 'Обложка книги обязательна'
    
    return null
  };

  const handleBookImport = (data: BookExportData) => {
    setImportedBookData(data);
    
    // Fill the form with imported data
    setFormData({
      title: data.book.title || '',
      description: data.book.description || '',
      grade_level: '', // Not stored in export data
      course: '', // Not stored in export data
      category: data.book.category || '',
      language: data.book.language || 'Русский',
      cover_image: data.book.cover_image || '',
      base_url: generateBaseUrl(data.book.title)
    });
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
      
      // Upload cover image if file is selected
      let coverImageUrl = formData.cover_image.trim();
      if (coverImageFile) {
        setUploadingImage(true);
        try {
          coverImageUrl = await uploadImageToSupabase(coverImageFile);
        } catch (uploadError) {
          setUploadingImage(false);
          setError(uploadError instanceof Error ? uploadError.message : 'Ошибка загрузки изображения');
          setIsLoading(false);
          return;
        }
        setUploadingImage(false);
      }
      
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
      const { data: createdBook, error: bookError } = await supabase
        .from('books')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          grade_level: formData.grade_level,
          course: formData.course.trim(),
          category: formData.category.trim(),
          language: formData.language,
          cover_image: coverImageUrl,
          base_url: formData.base_url,
          author_id: userProfile.id,
          status: 'Draft', // Set status to Draft so author can edit before sending to moderation
          // If we have imported data, store the canvas elements and settings
          canvas_elements: importedBookData ? JSON.stringify(importedBookData.elements) : null,
          canvas_settings: importedBookData ? JSON.stringify(importedBookData.settings) : null
        })
        .select()
        .single();

      if (bookError) {
        throw new Error(bookError.message);
      }

      // Add the user as the owner of the book in the collaboration table
      const { error: collaboratorError } = await supabase.rpc('add_book_owner', {
        book_uuid: createdBook.id,
        user_uuid: userProfile.id
      });

      if (collaboratorError) {
        console.error('Error adding book owner:', collaboratorError);
        // Don't throw an error here - the book was created successfully
        // Just log the error as this is not critical for book creation
      }

      setSuccess('Книга успешно создана как черновик! Переходим к редактору книги.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        grade_level: '',
        course: '',
        category: '',
        language: 'Русский',
        cover_image: '',
        base_url: ''
      });
      
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setImportedBookData(null);

      // Redirect to book editor after a short delay
      setTimeout(() => {
        router.push(`/dashboard/books/${createdBook.base_url}/edit`);
      }, 2000);

    } catch (err) {
      console.error('Error creating book:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании книги');
    } finally {
      setIsLoading(false);
    }
  };

  // Показываем загрузку если аутентификация еще не завершена
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку если пользователь не найден
  if (!userProfile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Ошибка аутентификации</h1>
          <p className="text-gray-600 mt-2">Пользователь не найден. Войдите в систему снова.</p>
          <Link href="/login">
            <Button className="mt-4">
              Войти в систему
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            Заполните форму для создания новой книги или импортируйте существующую
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
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Book Import Component */}
        <BookImport onImport={handleBookImport} />

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Информация о книге</CardTitle>
            <CardDescription>
              {importedBookData 
                ? 'Данные заполнены из импортированного файла. Вы можете внести изменения перед созданием книги.' 
                : 'Введите основную информацию о книге'}
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
                  <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map(course => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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


                <div className="md:col-span-2">
                  <Label htmlFor="cover_image">Обложка книги *</Label>
                  <div className="space-y-4">
                    <Input
                      id="cover_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {coverImagePreview && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
                        <img 
                          src={coverImagePreview} 
                          alt="Предпросмотр обложки" 
                          className="w-32 h-48 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Поддерживаемые форматы: JPEG, PNG, GIF. Максимальный размер: 5МБ
                    </p>
                  </div>
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
                  disabled={isLoading || uploadingImage}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка изображения...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Продолжить
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

export default function CreateBookPageWithSuspense() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CreateBookPage />
    </Suspense>
  );
} 
