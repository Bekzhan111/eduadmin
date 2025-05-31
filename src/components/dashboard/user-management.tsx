'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  email: string;
  role: 'super_admin' | 'author' | 'moderator' | 'school' | 'student' | 'teacher';
  school_id: string | null;
  created_at: string;
  last_sign_in_at?: string;
  display_name?: string;
};

type CurrentUser = {
  role: string;
  school_id: string | null;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const fetchUsers = useCallback(async (role: string, schoolId: string | null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Query users table (avoid using auth.admin API which requires service role)
      let query = supabase.from('users').select('*');
      
      // If school admin, only show users from their school
      if (role === 'school' && schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      const { data: profileUsers, error: profileError } = await query;
      
      if (profileError) {
        if (profileError.message.includes('infinite recursion')) {
          setError('Ошибка базы данных: Политика RLS нуждается в исправлении. См. HOW_TO_FIX_INFINITE_RECURSION.md');
        } else {
          setError(`Ошибка получения пользователей: ${profileError.message}`);
        }
        return;
      }
      
      if (!profileUsers) {
        setUsers([]);
        return;
      }
      
      setUsers(profileUsers);
    } catch (error) {
      setError(`Не удалось получить пользователей: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Fetch users error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkCurrentUserRole = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Ошибка аутентификации: Пожалуйста, войдите снова');
        setIsLoading(false);
        return;
      }
      
      if (!sessionData.session) {
        setError('Не аутентифицирован: Пожалуйста, войдите в систему');
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
          console.error('Error fetching user role:', userError);
          if (userError.message.includes('infinite recursion')) {
            setError('Ошибка базы данных: Политика RLS нуждается в исправлении. См. HOW_TO_FIX_INFINITE_RECURSION.md');
          } else {
            setError(`Ошибка получения роли пользователя: ${userError.message}`);
          }
          setIsLoading(false);
          return;
        }
        
        setCurrentUser(userData);
        
        // Only fetch users if user is super_admin or school
        if (userData.role === 'super_admin' || userData.role === 'school') {
          await fetchUsers(userData.role, userData.school_id);
        } else {
          setError('У вас нет разрешения на доступ к этой странице');
          setIsLoading(false);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        setError(`Ошибка базы данных: ${dbError instanceof Error ? dbError.message : 'Неизвестная ошибка'}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setError(`Неожиданная ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setIsLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    checkCurrentUserRole();
  }, [checkCurrentUserRole]);

  const changeRole = async (userId: string, newRole: User['role']) => {
    setActionLoading(userId);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (updateError) {
        setError(`Не удалось обновить роль: ${updateError.message}`);
        return;
      }
      
      // Refresh the user list
      if (currentUser) {
        fetchUsers(currentUser.role, currentUser.school_id);
      }
    } catch (error) {
      setError(`Не удалось обновить роль пользователя: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Update role error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <div className="p-4">Загрузка пользователей...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Button onClick={checkCurrentUserRole} className="mt-4">
          Попробовать Снова
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Управление Пользователями</h2>
        <Button 
          onClick={() => currentUser && fetchUsers(currentUser.role, currentUser.school_id)} 
          disabled={isLoading}
        >
          Обновить
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID/Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID Школы
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Создан
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.email || user.display_name || user.id.substring(0, 8) + '...'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.school_id || 'Н/Д'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {currentUser?.role === 'super_admin' || (currentUser?.role === 'school' && user.role !== 'super_admin') ? (
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value as User['role'])}
                      disabled={actionLoading === user.id}
                      className="px-3 py-1 border border-gray-300 rounded"
                    >
                      <option value="student">Студент</option>
                      <option value="teacher">Учитель</option>
                      {currentUser.role === 'super_admin' && (
                        <>
                          <option value="school">Школа</option>
                          <option value="moderator">Модератор</option>
                          <option value="author">Автор</option>
                          <option value="super_admin">Супер Администратор</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <span className="text-gray-500">Нет доступных действий</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          Пользователи не найдены
        </div>
      )}
    </div>
  );
} 