'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const roleRegSchema = z.object({
  registrationKey: z.string().min(6, 'Ключ регистрации должен содержать не менее 6 символов'),
});

type RoleRegValues = z.infer<typeof roleRegSchema>;

export default function RoleRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleRegValues>({
    resolver: zodResolver(roleRegSchema),
  });

  const onSubmit = async (data: RoleRegValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      // First, check if the user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Вы должны войти в систему для регистрации с ролью');
        return;
      }
      
      // Call our improved function to register with a key
      const { data: result, error: fnError } = await supabase.rpc(
        'register_with_key',
        {
          user_id: sessionData.session.user.id,
          registration_key: data.registrationKey
        }
      );
      
      if (fnError) {
        setError(fnError.message);
        return;
      }
      
      if (result.success) {
        setSuccess(result.message);
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
      console.error('Role registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border">
      <h2 className="text-lg font-medium mb-4">Регистрация с Ключом Роли</h2>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="registrationKey" className="block text-sm font-medium text-foreground mb-1">
            Ключ Регистрации
          </label>
          <Input
            id="registrationKey"
            type="text"
            {...register('registrationKey')}
            placeholder="Введите ваш ключ регистрации"
            className={errors.registrationKey ? 'border-destructive' : ''}
            disabled={isLoading}
          />
          {errors.registrationKey && (
            <p className="mt-1 text-xs text-destructive">{errors.registrationKey.message}</p>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Используйте ключ регистрации для:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Регистрации как учитель</li>
            <li>Регистрации как студент</li>
            <li>Регистрации как администратор школы</li>
            <li>Регистрации как автор</li>
            <li>Регистрации как модератор</li>
          </ul>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Обработка...' : 'Зарегистрироваться с Ключом'}
        </Button>
      </form>
    </div>
  );
} 