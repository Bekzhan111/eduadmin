'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schoolRegSchema = z.object({
  registrationKey: z.string().min(6, 'Ключ регистрации должен содержать не менее 6 символов'),
});

type SchoolRegValues = z.infer<typeof schoolRegSchema>;

export default function SchoolRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolRegValues>({
    resolver: zodResolver(schoolRegSchema),
  });

  const onSubmit = async (data: SchoolRegValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      // First, check if the user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Вы должны войти в систему для регистрации в качестве администратора школы');
        return;
      }
      
      // Call our custom function to update the user's role
      const { data: result, error: fnError } = await supabase.rpc(
        'register_as_school',
        {
          user_id: sessionData.session.user.id,
          reg_key: data.registrationKey
        }
      );
      
      if (fnError) {
        setError(fnError.message);
        return;
      }
      
      if (result === true) {
        setSuccess('Успешно зарегистрированы как администратор школы');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        setError('Недействительный ключ регистрации');
      }
    } catch (error) {
      setError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
      console.error('School registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Регистрация Школы</h2>
      
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Введите ваш ключ регистрации школы для регистрации в качестве администратора школы.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="registrationKey" className="block text-sm font-medium">
            Ключ Регистрации
          </label>
          <div className="mt-1">
            <Input
              id="registrationKey"
              type="text"
              disabled={isLoading}
              {...register('registrationKey')}
            />
            {errors.registrationKey && (
              <p className="mt-1 text-sm text-red-600">{errors.registrationKey.message}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться как Школа'}
          </Button>
        </div>
      </form>
    </div>
  );
} 