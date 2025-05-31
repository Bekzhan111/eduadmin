'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { createClient } from '@/utils/supabase';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { BookOpen, ArrowLeft, ShoppingCart, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  price: number;
  cover_image: string;
}

interface PurchaseForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  quantity: number;
  notes: string;
}

export default function PurchasePage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<PurchaseForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    quantity: 1,
    notes: ''
  });

  const fetchBook = useCallback(async () => {
    if (!bookId) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error fetching book:', error);
      setError('Не удалось загрузить детали книги');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const handleInputChange = (field: keyof PurchaseForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, form.quantity + delta);
    setForm(prev => ({ ...prev, quantity: newQuantity }));
  };

  const validateForm = (): boolean => {
    if (!form.customer_name.trim()) {
      setError('Имя обязательно');
      return false;
    }
    if (!form.customer_email.trim()) {
      setError('Email обязателен');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.customer_email)) {
      setError('Пожалуйста, введите действительный адрес электронной почты');
      return false;
    }
    if (form.quantity < 1) {
      setError('Количество должно быть не менее 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !book) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const purchaseData = {
        book_id: book.id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_address: form.customer_address.trim() || null,
        quantity: form.quantity,
        total_price: book.price ? book.price * form.quantity : 0,
        notes: form.notes.trim() || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('book_purchase_requests')
        .insert([purchaseData]);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      setError('Не удалось отправить запрос на покупку. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <SkeletonLoader type="text" lines={1} className="w-1/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonLoader type="card" height={400} />
            <SkeletonLoader type="card" height={500} />
          </div>
        </div>
      </main>
    );
  }

  if (error && !book) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Книга недоступна
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/marketplace">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к книгам
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MarketplaceHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Запрос на покупку отправлен!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Спасибо за ваш запрос на покупку. Мы получили ваш заказ на{' '}
              <strong>{book?.title}</strong> и свяжемся с вами в течение 1-2 рабочих дней 
              для подтверждения заказа и организации доставки.
            </p>
            <div className="space-y-3">
              <Link href={`/marketplace/books/${book?.id}`}>
                <Button variant="outline" className="w-full">
                  Посмотреть детали книги
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button className="w-full">
                  Продолжить покупки
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const totalPrice = book?.price ? book.price * form.quantity : 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/marketplace/books/${book?.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к деталям книги
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Book Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Сводка заказа
                </CardTitle>
              </CardHeader>
              <CardContent>
                {book && (
                  <div className="flex gap-4">
                    {book.cover_image ? (
                      <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <Image 
                          src={book.cover_image} 
                          alt={book.title}
                          width={100}
                          height={140}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-28 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {book.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {book.grade_level && (
                          <Badge variant="secondary" className="text-xs">
                            {book.grade_level}
                          </Badge>
                        )}
                        {book.category && (
                          <Badge variant="outline" className="text-xs">
                            {book.category}
                          </Badge>
                        )}
                      </div>
                      
                      {book.course && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                          {book.course}
                        </p>
                      )}
                      
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${book.price || 'Бесплатно'} за штуку
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span>Количество:</span>
                    <span className="font-medium">{form.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-2">
                    <span>Итого:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Запрос на покупку</CardTitle>
                <p className="text-gray-600">
                  Заполните форму ниже, чтобы запросить эту книгу. Мы свяжемся с вами для организации оплаты и доставки.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Полное имя *</Label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_email">Адрес электронной почты *</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={form.customer_email}
                        onChange={(e) => handleInputChange('customer_email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer_phone">Номер телефона</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer_address">Адрес доставки</Label>
                    <Textarea
                      id="customer_address"
                      value={form.customer_address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('customer_address', e.target.value)}
                      rows={3}
                      placeholder="Введите ваш полный адрес доставки"
                    />
                  </div>

                  <div>
                    <Label>Количество</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustQuantity(-1)}
                        disabled={form.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={form.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        max="100"
                        className="w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustQuantity(1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Дополнительные заметки</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Любые специальные инструкции или требования"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? 'Отправка...' : 'Отправить запрос на покупку'}
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-4">
                      Отправляя этот запрос, вы соглашаетесь с нашими условиями обслуживания. Мы свяжемся с вами для подтверждения заказа и организации оплаты.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
} 