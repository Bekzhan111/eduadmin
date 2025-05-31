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
import { ShoppingCart, CheckCircle, AlertCircle, ArrowLeft, Package, Users, Calculator } from 'lucide-react';

interface BulkPurchaseForm {
  school_name: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  school_address: string;
  school_city: string;
  school_bin: string;
  request_type: string;
  students_count: number;
  notes: string;
}

export default function BulkPurchasePage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<BulkPurchaseForm>({
    school_name: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    school_address: '',
    school_city: '',
    school_bin: '',
    request_type: 'all_books',
    students_count: 0,
    notes: ''
  });

  const handleInputChange = (field: keyof BulkPurchaseForm, value: string | number) => {
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
    if (form.students_count < 1) {
      setError('Количество студентов должно быть не менее 1');
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
      
      const bulkPurchaseData = {
        school_name: form.school_name.trim(),
        contact_person_name: form.contact_person_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        school_address: form.school_address.trim() || null,
        school_city: form.school_city.trim() || null,
        school_bin: form.school_bin.trim() || null,
        request_type: form.request_type,
        students_count: form.students_count,
        notes: form.notes.trim() || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('bulk_purchase_requests')
        .insert([bulkPurchaseData]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting bulk purchase request:', error);
      setError('Не удалось отправить запрос на оптовую покупку. Пожалуйста, попробуйте еще раз.');
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
              Запрос на оптовую покупку отправлен!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Спасибо за ваш запрос на оптовую покупку. Мы получили ваш запрос для{' '}
              <strong>{form.school_name}</strong> и подготовим индивидуальное предложение для{' '}
              {form.students_count} студентов. Наша команда свяжется с вами в течение 1-2 рабочих дней 
              с деталями цен и следующими шагами.
            </p>
            <div className="space-y-3">
              <Link href="/school-registration">
                <Button variant="outline" className="w-full">
                  Зарегистрировать вашу школу
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button className="w-full">
                  Просмотреть отдельные книги
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
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Запрос на оптовую покупку
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Получите специальные цены для вашего образовательного учреждения с оптовыми покупками книг
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-4">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Полная библиотека</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Доступ ко всем образовательным книгам в нашем каталоге
              </p>
            </Card>
            <Card className="text-center p-4">
              <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Скидки за объем</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Специальные цены в зависимости от количества студентов
              </p>
            </Card>
            <Card className="text-center p-4">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Лицензии для студентов</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Индивидуальный доступ для всех ваших студентов
              </p>
            </Card>
          </div>

          {/* Pricing Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Как работают оптовые цены</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">1-50 студентов</span>
                  <span className="text-green-600 font-bold">Скидка 20%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">51-200 студентов</span>
                  <span className="text-green-600 font-bold">Скидка 35%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">201+ студентов</span>
                  <span className="text-green-600 font-bold">Скидка 50%</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  * Окончательная цена будет рассчитана на основе ваших конкретных требований и количества студентов.
                  Дополнительные скидки могут применяться для многолетних обязательств.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Запросить предложение на оптовую покупку</CardTitle>
              <CardDescription>
                Заполните форму ниже, и мы подготовим индивидуальное предложение для вашего учреждения
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

                {/* School Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Информация о школе</h3>
                  
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

                {/* Purchase Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Детали покупки</h3>
                  
                  <div>
                    <Label htmlFor="request_type">Тип покупки</Label>
                    <Select value={form.request_type} onValueChange={(value) => handleInputChange('request_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип покупки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_books">Все книги (Полная библиотека)</SelectItem>
                        <SelectItem value="selected_books">Только выбранные книги</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Выберите &quot;Все книги&quot; для доступа к нашей полной образовательной библиотеке, или &quot;Выбранные книги&quot; 
                      если вы хотите приобрести только определенные названия.
                    </p>
                  </div>

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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Это определит ваш уровень скидки за объем и лицензионные требования.
                    </p>
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
                  <Label htmlFor="notes">Дополнительные требования или вопросы</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    placeholder="Расскажите нам о ваших конкретных потребностях, предпочитаемых предметах, классах или любых других требованиях"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Отправка...' : 'Запросить предложение на оптовую покупку'}
                  </Button>
                  
                  <p className="text-gray-600">
                    Мы рассмотрим ваш запрос и предоставим индивидуальное предложение в течение 24 часов.
                  </p>
                  <p className="text-sm text-gray-600">
                    Отправляя эту форму, вы соглашаетесь с нашими &quot;Условиями обслуживания&quot; и &quot;Политикой конфиденциальности&quot;.
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