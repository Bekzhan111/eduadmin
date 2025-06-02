'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
};

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    const results: TestResult[] = [];

    // Test 1: Environment Variables
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        results.push({
          name: 'Переменные окружения',
          status: 'error',
          message: 'Отсутствуют переменные окружения',
          details: `URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}`
        });
      } else {
        results.push({
          name: 'Переменные окружения',
          status: 'success',
          message: 'Переменные окружения настроены',
          details: `URL: ${supabaseUrl}, Key: ${supabaseKey.substring(0, 20)}...`
        });
      }
    } catch (error) {
      results.push({
        name: 'Переменные окружения',
        status: 'error',
        message: 'Ошибка при проверке переменных',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 2: Supabase Client Creation
    try {
      const supabase = createClient();
      results.push({
        name: 'Создание клиента Supabase',
        status: 'success',
        message: 'Клиент создан успешно'
      });

      // Test 3: Basic API Call
      try {
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (error) {
          results.push({
            name: 'Подключение к API',
            status: 'error',
            message: 'Ошибка API',
            details: error.message
          });
        } else {
          results.push({
            name: 'Подключение к API',
            status: 'success',
            message: 'API отвечает нормально',
            details: `Получен ответ: ${data ? data.length : 0} записей`
          });
        }
      } catch (apiError) {
        results.push({
          name: 'Подключение к API',
          status: 'error',
          message: 'Сетевая ошибка API',
          details: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }

      // Test 4: Auth Session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          results.push({
            name: 'Проверка сессии',
            status: 'warning',
            message: 'Ошибка получения сессии',
            details: sessionError.message
          });
        } else if (sessionData.session) {
          results.push({
            name: 'Проверка сессии',
            status: 'success',
            message: 'Сессия активна',
            details: `User: ${sessionData.session.user.email}`
          });
        } else {
          results.push({
            name: 'Проверка сессии',
            status: 'warning',
            message: 'Сессия не найдена',
            details: 'Пользователь не авторизован'
          });
        }
      } catch (sessionError) {
        results.push({
          name: 'Проверка сессии',
          status: 'error',
          message: 'Ошибка при проверке сессии',
          details: sessionError instanceof Error ? sessionError.message : String(sessionError)
        });
      }

    } catch (clientError) {
      results.push({
        name: 'Создание клиента Supabase',
        status: 'error',
        message: 'Ошибка создания клиента',
        details: clientError instanceof Error ? clientError.message : String(clientError)
      });
    }

    setTests(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Успешно</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Предупреждение</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Ошибка</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Диагностика Подключения
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Проверка соединения с Supabase и состояния аутентификации
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Тесты Подключения</CardTitle>
          <CardDescription>
            Запустите тесты для диагностики проблем с подключением
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Выполнение тестов...
              </>
            ) : (
              'Запустить Тесты'
            )}
          </Button>
        </CardContent>
      </Card>

      {tests.length > 0 && (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {test.name}
                      </h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {test.message}
                    </p>
                    {test.details && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <code className="text-sm text-gray-800 dark:text-gray-200">
                          {test.details}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tests.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Рекомендации</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>• Если тесты показывают ошибки сети, проверьте подключение к интернету</p>
              <p>• При ошибках API убедитесь, что Supabase проект активен</p>
              <p>• Проверьте правильность переменных окружения в файле .env</p>
              <p>• Очистите кэш браузера, если проблемы повторяются</p>
              <p>• Попробуйте перезагрузить страницу или перезапустить приложение</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 