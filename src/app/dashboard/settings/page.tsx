'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { User, Mail, Shield, School, Save, Eye, EyeOff } from 'lucide-react';

type UserSettings = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  school_id: string | null;
  school_name?: string;
  profile_picture?: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  created_at: string;
  last_login?: string;
};

export default function SettingsPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!userProfile?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            display_name,
            role,
            school_id,
            profile_picture,
            first_name,
            last_name,
            is_active,
            created_at,
            last_login
          `)
          .eq('id', userProfile.id)
          .single();
          
        if (userError) {
          throw new Error(`Не удалось получить настройки пользователя: ${userError.message}`);
        }
        
        // Fetch school name if user has school_id
        let schoolName;
        if (userData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('name')
            .eq('id', userData.school_id)
            .single();
            
          if (!schoolError && schoolData) {
            schoolName = schoolData.name;
          }
        }
        
        const userSettings = {
          ...userData,
          school_name: schoolName,
        };
        
        setSettings(userSettings);
        setDisplayName(userData.display_name || '');
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
      } catch (error) {
        console.error('Error fetching user settings:', error);
        setError(error instanceof Error ? error.message : 'Не удалось получить настройки пользователя');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserSettings();
    }
  }, [userProfile, authLoading]);

  const handleSaveSettings = async () => {
    if (!settings?.id) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim() || null,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        })
        .eq('id', settings.id);
        
      if (error) {
        throw new Error(`Не удалось обновить настройки: ${error.message}`);
      }
      
      setSuccess('Настройки успешно обновлены!');
      
      // Update local state
      setSettings(prev => prev ? {
        ...prev,
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      } : null);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white';
      case 'school': return 'bg-blue-500 text-white';
      case 'teacher': return 'bg-green-500 text-white';
      case 'student': return 'bg-yellow-500 text-black';
      case 'author': return 'bg-purple-500 text-white';
      case 'moderator': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'super_admin': return 'СУПЕР АДМИНИСТРАТОР';
      case 'school': return 'ШКОЛА';
      case 'teacher': return 'УЧИТЕЛЬ';
      case 'student': return 'СТУДЕНТ';
      case 'author': return 'АВТОР';
      case 'moderator': return 'МОДЕРАТОР';
      default: return role.replace('_', ' ').toUpperCase();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="text" lines={1} className="w-1/2" />
        </div>
        
        {/* Profile card skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SkeletonLoader type="card" count={1} height={200} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            {/* Account info skeleton */}
            <SkeletonLoader type="card" count={1} height={150} />
            
            {/* Settings form skeleton */}
            <div className="space-y-4">
              <SkeletonLoader type="text" lines={1} className="w-1/6" />
              <SkeletonLoader type="custom" height={40} width="100%" count={3} />
              <SkeletonLoader type="custom" height={40} width={100} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Ошибка</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Перезагрузить Страницу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Настройки пользователя не найдены.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Настройки</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Управляйте настройками аккаунта и предпочтениями
        </p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">
              <p className="font-semibold">Ошибка</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* User Info Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Информация Пользователя
          </CardTitle>
          <CardDescription>
            Обзор информации вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900 dark:text-white">{settings.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Роль</p>
                  <Badge className={getRoleBadgeColor(settings.role)}>
                    {translateRole(settings.role)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {settings.school_name && (
                <div className="flex items-center space-x-3">
                  <School className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Школа</p>
                    <p className="text-gray-900 dark:text-white">{settings.school_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Участник с</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(settings.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки Профиля</CardTitle>
          <CardDescription>
            Обновите информацию вашего профиля
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Отображаемое Имя</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Введите ваше отображаемое имя"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Имя</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите ваше имя"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Фамилия</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите вашу фамилию"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (Только для чтения)</label>
                <Input
                  value={settings.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="min-w-[120px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить Изменения'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>Безопасность Аккаунта</CardTitle>
          <CardDescription>
            Управляйте настройками безопасности вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Пароль</p>
                <p className="text-sm text-gray-500">Изменить пароль вашего аккаунта</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Скрыть
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Изменить Пароль
                  </>
                )}
              </Button>
            </div>
            
            {showPasswordSection && (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    По соображениям безопасности изменение пароля должно производиться через Supabase Auth. 
                    Вы можете сбросить пароль, выйдя из системы и используя опцию &quot;Забыли пароль?&quot;.
                  </p>
                  <Button variant="outline" size="sm">
                    Запросить Сброс Пароля
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 