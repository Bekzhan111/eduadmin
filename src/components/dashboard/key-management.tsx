'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type RegistrationKey = {
  id: string;
  key: string;
  role: 'school' | 'teacher' | 'student' | 'author' | 'moderator';
  school_id: string | null;
  is_active: boolean;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  created_at: string;
  created_by: string;
};

type School = {
  id: string;
  name: string;
};

const createKeySchema = z.object({
  role: z.enum(['school', 'teacher', 'student', 'author', 'moderator']),
  schoolId: z.string().optional(),
  maxUses: z.coerce.number().int().positive(),
  expiresInDays: z.coerce.number().int().min(1).max(365),
});

type CreateKeyValues = z.infer<typeof createKeySchema>;

export default function KeyManagement() {
  const [keys, setKeys] = useState<RegistrationKey[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateKeyValues>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      role: 'student',
      maxUses: 1,
      expiresInDays: 7
    }
  });
  
  const selectedRole = watch('role');
  
  useEffect(() => {
    const checkDatabaseTables = async () => {
      try {
        const supabase = createClient();
        const { data: _profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
          
        if (profileError) {
          if (profileError.code === '42P01') { // PostgreSQL error code for undefined_table
            console.error('Users table does not exist:', profileError);
            setError('Таблица базы данных "users" не существует. Пожалуйста, выполните миграции базы данных.');
          } else {
            console.error('Error checking users table:', profileError);
            setError(`Ошибка базы данных: ${profileError.message}`);
          }
          setIsLoading(false);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error checking database tables:', error);
        setError(`Ошибка подключения к базе данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        setIsLoading(false);
        return false;
      }
    };
    
    const fetchUserInfo = async () => {
      try {
        // First check if database tables exist
        const tablesExist = await checkDatabaseTables();
        if (!tablesExist) return;
        
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Ошибка аутентификации сессии. Пожалуйста, попробуйте войти снова.');
          setIsLoading(false);
          return;
        }
        
        if (!sessionData.session) {
          setError('Нет активной сессии. Пожалуйста, войдите в систему.');
          setIsLoading(false);
          return;
        }
        
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, school_id')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user info:', userError);
            setError(`Не удалось загрузить данные пользователя: ${userError.message || 'Неизвестная ошибка'}`);
            setIsLoading(false);
            return;
          }
          
          if (!userData) {
            console.error('No user data found');
            setError('Профиль пользователя не найден. Пожалуйста, обратитесь к администратору.');
            setIsLoading(false);
            return;
          }
          
          setUserRole(userData.role);
          setUserSchoolId(userData.school_id);
          
          await fetchKeys(userData.role, userData.school_id);
          
          if (userData.role === 'super_admin' || userData.role === 'school') {
            await fetchSchools(userData.role, userData.school_id);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          setError(`Ошибка базы данных: ${dbError instanceof Error ? dbError.message : 'Неизвестная ошибка'}`);
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError(`Неожиданная ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        setIsLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  const fetchKeys = async (role: string, schoolId: string | null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      let query = supabase
        .from('registration_keys')
        .select('*');
        
      // If school admin, only show keys for their school
      if (role === 'school' && schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      try {  
        const { data, error: keysError } = await query;
        
        if (keysError) {
          setError(`Не удалось получить ключи: ${keysError.message}`);
          console.error('Keys error:', keysError);
          return;
        }
        
        setKeys(data || []);
      } catch (dbError) {
        setError(`Ошибка базы данных при получении ключей: ${dbError instanceof Error ? dbError.message : 'Неизвестная ошибка'}`);
        console.error('Database error in fetchKeys:', dbError);
      }
    } catch (error) {
      setError(`Не удалось получить ключи регистрации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Fetch keys error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSchools = async (role: string, schoolId: string | null) => {
    try {
      const supabase = createClient();
      let query = supabase
        .from('schools')
        .select('id, name');
        
      // If school admin, only show their school
      if (role === 'school' && schoolId) {
        query = query.eq('id', schoolId);
      }
      
      try {
        const { data, error: schoolsError } = await query;
        
        if (schoolsError) {
          console.error('Error fetching schools:', schoolsError);
          setError(`Failed to fetch schools: ${schoolsError.message}`);
          return;
        }
        
        setSchools(data || []);
      } catch (dbError) {
        console.error('Database error in fetchSchools:', dbError);
        setError(`Database error when fetching schools: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError(`Failed to fetch schools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const onSubmit = async (data: CreateKeyValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('You must be logged in to create keys');
        return;
      }
      
      // Calculate expiration date
      const expiresIn = `${data.expiresInDays} days`;
      
      // Set school ID based on role and user
      let schoolId: string | null = null;
      
      if (data.role === 'student' || data.role === 'teacher') {
        // For student/teacher keys, a school must be selected or used from user's school
        if (userRole === 'super_admin') {
          schoolId = data.schoolId || null;
          if (!schoolId) {
            setError('You must select a school for student or teacher keys');
            setIsLoading(false);
            return;
          }
        } else if (userRole === 'school') {
          // School admin can only create keys for their own school
          schoolId = userSchoolId;
        }
      }
      
      const { data: result, error: createError } = await supabase.rpc(
        'create_registration_key',
        {
          creator_id: sessionData.session.user.id,
          role: data.role,
          school_id: schoolId,
          max_uses: data.maxUses,
          expires_in: expiresIn
        }
      );
      
      if (createError) {
        setError(createError.message);
        return;
      }
      
      if (!result.success) {
        setError(result.message);
        return;
      }
      
      setSuccess(`Key created: ${result.key}`);
      
      // Refresh the keys list
      fetchKeys(userRole || '', userSchoolId);
      
      // Reset form
      reset();
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Create key error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleKeyStatus = async (keyId: string, isCurrentlyActive: boolean) => {
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('registration_keys')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', keyId);
      
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // Refresh the keys list
      fetchKeys(userRole || '', userSchoolId);
    } catch (error) {
      setError('Не удалось обновить статус ключа');
      console.error('Toggle key error:', error);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };
  
  if (isLoading && keys.length === 0) {
    return <div className="p-4">Загрузка ключей регистрации...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Создать Ключ Регистрации</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Роль
            </label>
            <select 
              id="role"
              {...register('role')}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="student">Студент</option>
              <option value="teacher">Учитель</option>
              {userRole === 'super_admin' && (
                <>
                  <option value="school">Администратор Школы</option>
                  <option value="author">Автор</option>
                  <option value="moderator">Модератор</option>
                </>
              )}
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>
          
          {(selectedRole === 'student' || selectedRole === 'teacher') && userRole === 'super_admin' && (
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium mb-1">
                Школа
              </label>
              <select
                id="schoolId"
                {...register('schoolId')}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="">Выберите школу</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="mt-1 text-xs text-red-500">{errors.schoolId.message}</p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxUses" className="block text-sm font-medium mb-1">
                Максимальное Количество Использований
              </label>
              <Input
                id="maxUses"
                type="number"
                {...register('maxUses')}
                min="1"
                className={errors.maxUses ? 'border-red-300' : ''}
              />
              {errors.maxUses && (
                <p className="mt-1 text-xs text-red-500">{errors.maxUses.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="expiresInDays" className="block text-sm font-medium mb-1">
                Истекает через (Дни)
              </label>
              <Input
                id="expiresInDays"
                type="number"
                {...register('expiresInDays')}
                min="1"
                max="365"
                className={errors.expiresInDays ? 'border-red-300' : ''}
              />
              {errors.expiresInDays && (
                <p className="mt-1 text-xs text-red-500">{errors.expiresInDays.message}</p>
              )}
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать Ключ Регистрации'}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Ключи Регистрации</h2>
        
        {keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ключ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Школа</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Использования</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Истекает</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {key.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {key.role.charAt(0).toUpperCase() + key.role.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {key.school_id ? (
                        schools.find(s => s.id === key.school_id)?.name || key.school_id
                      ) : (
                        'Н/Д'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {key.uses} / {key.max_uses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(key.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          key.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {key.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        size="sm"
                        variant={key.is_active ? 'destructive' : 'outline'}
                        onClick={() => toggleKeyStatus(key.id, key.is_active)}
                      >
                        {key.is_active ? 'Деактивировать' : 'Активировать'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            Ключи регистрации не найдены
          </div>
        )}
      </div>
    </div>
  );
} 