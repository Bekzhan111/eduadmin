'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/marketplace/books/${bookId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к книге
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-center justify-center">
                <Info className="h-6 w-6 mr-2 text-blue-600" />
                Информация о доступе к книгам
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Образовательный контент теперь доступен бесплатно
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Мы изменили нашу модель и теперь предоставляем образовательные материалы 
                  без взимания платы. Все книги доступны для образовательных учреждений.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Как получить доступ?
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Свяжитесь с нашей командой для получения доступа к образовательным материалам 
                  для вашего учебного заведения.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/contact">
                  <Button size="lg" className="w-full">
                    Связаться с нами
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" size="lg" className="w-full">
                    Посмотреть другие книги
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}