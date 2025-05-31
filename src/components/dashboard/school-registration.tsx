'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schoolSchema = z.object({
  name: z.string().min(2, 'Название школы должно содержать не менее 2 символов'),
  registrationKey: z.string().min(6, 'Ключ регистрации должен содержать не менее 6 символов'),
  maxStudents: z.coerce.number().min(1, 'Максимальное количество студентов должно быть положительным числом'),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

export default function SchoolRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      maxStudents: 100,
    },
  });

  const onSubmit = async (data: SchoolFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      
      // Insert the new school
      const { error: insertError } = await supabase
        .from('schools')
        .insert({
          name: data.name,
          registration_key: data.registrationKey,
          max_students: data.maxStudents,
        });
      
      if (insertError) {
        setError(insertError.message);
        return;
      }
      
      setSuccess(`Школа "${data.name}" успешно зарегистрирована с ключом регистрации: ${data.registrationKey}`);
      reset();
    } catch (error) {
      setError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
      console.error('School registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Зарегистрировать Новую Школу</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Название Школы
          </label>
          <div className="mt-1">
            <Input
              id="name"
              type="text"
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

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
          <p className="mt-1 text-xs text-gray-500">
            Этот ключ будет использоваться администраторами школы для регистрации их аккаунта
          </p>
        </div>

        <div>
          <label htmlFor="maxStudents" className="block text-sm font-medium">
            Максимальное Количество Студентов
          </label>
          <div className="mt-1">
            <Input
              id="maxStudents"
              type="number"
              min="1"
              disabled={isLoading}
              {...register('maxStudents')}
            />
            {errors.maxStudents && (
              <p className="mt-1 text-sm text-red-600">{errors.maxStudents.message}</p>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрировать Школу'}
          </Button>
        </div>
      </form>
    </div>
  );
} 