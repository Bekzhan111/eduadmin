'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const studentRegSchema = z.object({
  schoolKey: z.string().min(6, 'Ключ регистрации школы должен содержать не менее 6 символов'),
});

type StudentRegValues = z.infer<typeof studentRegSchema>;

export default function StudentRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentRegValues>({
    resolver: zodResolver(studentRegSchema),
  });

  const onSubmit = async (data: StudentRegValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      // First, check if the user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Вы должны войти в систему для регистрации в качестве студента');
        return;
      }
      
      // Call our custom function to update the user's role
      const { data: result, error: fnError } = await supabase.rpc(
        'register_as_student',
        {
          user_id: sessionData.session.user.id,
          school_reg_key: data.schoolKey
        }
      );
      
      if (fnError) {
        setError(fnError.message);
        return;
      }
      
      if (result === true) {
        setSuccess('Успешно зарегистрированы как студент');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        setError('Недействительный ключ регистрации школы или школа достигла лимита студентов');
      }
    } catch (error) {
      setError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
      console.error('Student registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Регистрация Студента</h2>
      
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Введите ключ регистрации вашей школы для регистрации в качестве студента.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="schoolKey" className="block text-sm font-medium">
            Ключ Регистрации Школы
          </label>
          <div className="mt-1">
            <Input
              id="schoolKey"
              type="text"
              disabled={isLoading}
              {...register('schoolKey')}
            />
            {errors.schoolKey && (
              <p className="mt-1 text-sm text-red-600">{errors.schoolKey.message}</p>
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
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться как Студент'}
          </Button>
        </div>
      </form>
    </div>
  );
} 