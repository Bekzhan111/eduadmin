import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import FeaturedBooks from '@/components/marketplace/FeaturedBooks';
import { BookOpen, Users, School, GraduationCap, ShoppingCart } from 'lucide-react';
import { SkeletonLoader } from '@/components/ui/skeleton';

// Mark this page as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketplaceHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Маркетплейс Образовательных Книг
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Открывайте, покупайте и получайте доступ к высококачественному образовательному контенту для частных лиц и школ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/20 hover:bg-white/20">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Купить Книги
              </Button>
            </Link>
            <Link href="/school-registration">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/20 hover:bg-white/20">
                <School className="mr-2 h-5 w-5" />
                Присоединиться как Школа
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Почему Выбирают Нашу Платформу?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Мы предоставляем комплексные образовательные решения как для частных лиц, так и для учреждений
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Качественный Контент</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Тщательно отобранные образовательные книги от проверенных авторов и издательств
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Индивидуальные Покупки</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Покупайте отдельные книги для личного обучения и развития
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <School className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Школьные Решения</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Оптовые покупки и институциональный доступ для образовательных учреждений
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Рекомендуемые Книги
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Изучите наш самый популярный образовательный контент
            </p>
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={6} height={300} />
            </div>
          }>
            <FeaturedBooks />
          </Suspense>
          
          <div className="text-center mt-8">
            <Link href="/marketplace">
              <Button size="lg" variant="outline">
                Посмотреть Все Книги
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Individual Customers */}
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Для Частных Лиц</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <CardDescription className="text-lg">
                  Покупайте отдельные книги для личного обучения
                </CardDescription>
                <ul className="text-left space-y-2 max-w-sm mx-auto">
                  <li className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                    Простой процесс заказа
                  </li>
                  <li className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                    Мгновенный доступ после покупки
                  </li>
                  <li className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                    Множество форматов на выбор
                  </li>
                </ul>
                <Link href="/marketplace">
                  <Button className="w-full">Просмотреть Книги</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Schools */}
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <School className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Для Школ</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <CardDescription className="text-lg">
                  Присоединитесь к нашей платформе и получите доступ ко всему образовательному контенту
                </CardDescription>
                <ul className="text-left space-y-2 max-w-sm mx-auto">
                  <li className="flex items-center">
                    <School className="h-4 w-4 mr-2 text-purple-600" />
                    Оптовые цены
                  </li>
                  <li className="flex items-center">
                    <School className="h-4 w-4 mr-2 text-purple-600" />
                    Инструменты управления студентами
                  </li>
                  <li className="flex items-center">
                    <School className="h-4 w-4 mr-2 text-purple-600" />
                    Полный доступ к библиотеке
                  </li>
                </ul>
                <div className="space-y-2">
                  <Link href="/school-registration">
                    <Button className="w-full" variant="default">Зарегистрировать Школу</Button>
                  </Link>
                  <Link href="/bulk-purchase">
                    <Button className="w-full" variant="outline">Запросить Оптовую Покупку</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
