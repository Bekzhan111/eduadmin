'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Доступ Запрещен</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          У вас нет разрешения на доступ к этой странице. Пожалуйста, войдите с соответствующими учетными данными или обратитесь к администратору.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto"
          >
            Войти
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
          >
            Вернуться к Панели
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Нужна другая роль? 
            <Link href="/register" className="ml-1 text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Зарегистрируйтесь с ключом
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 