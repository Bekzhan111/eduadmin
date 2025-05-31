'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { School, CheckCircle, AlertCircle, ArrowLeft, Building, Users, GraduationCap } from 'lucide-react';

interface SchoolRegistrationForm {
  school_name: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  school_address: string;
  school_city: string;
  school_bin: string;
  school_type: string;
  students_count: number;
  teachers_count: number;
  website: string;
  description: string;
}

export default function SchoolRegistrationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<SchoolRegistrationForm>({
    school_name: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    school_address: '',
    school_city: '',
    school_bin: '',
    school_type: '',
    students_count: 0,
    teachers_count: 0,
    website: '',
    description: ''
  });

  const handleInputChange = (field: keyof SchoolRegistrationForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.school_name.trim()) {
      setError('Название школы обязательно');
      return false;
    }
    if (!form.contact_person_name.trim()) {
      setError('Имя контактного лица обязательно');
      return false;
    }
    if (!form.contact_email.trim()) {
      setError('Контактный email обязателен');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      setError('Пожалуйста, введите действительный адрес электронной почты');
      return false;
    }
    if (!form.school_type) {
      setError('Пожалуйста, выберите тип школы');
      return false;
    }
    if (form.students_count < 1) {
      setError('Количество студентов должно быть не менее 1');
      return false;
    }
    if (form.teachers_count < 1) {
      setError('Количество учителей должно быть не менее 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const registrationData = {
        school_name: form.school_name.trim(),
        contact_person_name: form.contact_person_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        school_address: form.school_address.trim() || null,
        school_city: form.school_city.trim() || null,
        school_bin: form.school_bin.trim() || null,
        school_type: form.school_type,
        students_count: form.students_count,
        teachers_count: form.teachers_count,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('school_registration_requests')
        .insert([registrationData]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting school registration:', error);
      setError('Не удалось отправить запрос на регистрацию. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Запрос на регистрацию отправлен!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Спасибо за ваш интерес к присоединению к нашей образовательной платформе. Мы получили 
              ваш запрос на регистрацию для <strong>{form.school_name}</strong> и рассмотрим 
              его в течение 3-5 рабочих дней. Вы получите подтверждение по электронной почте после 
              одобрения вашей заявки.
            </p>
            <div className="space-y-3">
              <Link href="/bulk-purchase">
                <Button variant="outline" className="w-full">
                  Запросить оптовую покупку
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full">
                  Назад на главную
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад на главную
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <School className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Регистрация школы
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Присоединитесь к нашей образовательной платформе и получите доступ к нашей полной библиотеке образовательных книг
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-4">
              <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Институциональный доступ</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Полный доступ к библиотеке для вашего учреждения
              </p>
            </Card>
            <Card className="text-center p-4">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Управление студентами</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Управляйте доступом и прогрессом студентов
              </p>
            </Card>
            <Card className="text-center p-4">
              <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Оптовые цены</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Специальные цены для образовательных учреждений
              </p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о школе</CardTitle>
              <CardDescription>
                Пожалуйста, предоставьте данные вашей школы для присоединения к нашей платформе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* School Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Детали школы</h3>
                  
                  <div>
                    <Label htmlFor="school_name">Название школы *</Label>
                    <Input
                      id="school_name"
                      type="text"
                      value={form.school_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="school_type">Тип школы *</Label>
                      <Select value={form.school_type} onValueChange={(value) => handleInputChange('school_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип школы" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Начальная школа</SelectItem>
                          <SelectItem value="secondary">Средняя школа</SelectItem>
                          <SelectItem value="high">Старшая школа</SelectItem>
                          <SelectItem value="college">Колледж</SelectItem>
                          <SelectItem value="university">Университет</SelectItem>
                          <SelectItem value="vocational">Профессиональное училище</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="school_bin">Бизнес-идентификационный номер</Label>
                      <Input
                        id="school_bin"
                        type="text"
                        value={form.school_bin}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_bin', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="school_address">Адрес школы</Label>
                      <Input
                        id="school_address"
                        type="text"
                        value={form.school_address}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_address', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="school_city">Город</Label>
                      <Input
                        id="school_city"
                        type="text"
                        value={form.school_city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('school_city', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="students_count">Количество студентов *</Label>
                      <Input
                        id="students_count"
                        type="number"
                        min="1"
                        value={form.students_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('students_count', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="teachers_count">Количество учителей *</Label>
                      <Input
                        id="teachers_count"
                        type="number"
                        min="1"
                        value={form.teachers_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('teachers_count', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Веб-сайт школы</Label>
                    <Input
                      id="website"
                      type="url"
                      value={form.website}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.yourschool.com"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Контактная информация</h3>
                  
                  <div>
                    <Label htmlFor="contact_person_name">Имя контактного лица *</Label>
                    <Input
                      id="contact_person_name"
                      type="text"
                      value={form.contact_person_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_person_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Контактный Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={form.contact_email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_email', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Контактный телефон</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={form.contact_phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <Label htmlFor="description">Дополнительная информация</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Расскажите нам больше о вашей школе и образовательных потребностях"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Отправка...' : 'Отправить запрос на регистрацию'}
                  </Button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Отправляя эту форму, вы соглашаетесь на контакт относительно вашей регистрации.
                    Мы рассмотрим вашу заявку и ответим в течение 3-5 рабочих дней.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 