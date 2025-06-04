'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const { userProfile, isLoading } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSuccess('Настройки сохранены!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3 text-blue-600" />
          Настройки
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управление настройками вашего аккаунта
        </p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-green-600">
              <p className="font-semibold">Успех</p>
              <p>{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Информация Пользователя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900 dark:text-white">{userProfile?.email || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Роль</p>
              <p className="text-gray-900 dark:text-white">{userProfile?.role || 'Не указана'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Отображаемое имя</p>
              <p className="text-gray-900 dark:text-white">{userProfile?.display_name || 'Не указано'}</p>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSave}>
                Сохранить изменения
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 