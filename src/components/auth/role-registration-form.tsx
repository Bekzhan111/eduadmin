'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  School,
  Building,
  Users,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';

const roleRegSchema = z.object({
  registrationKey: z.string().min(6, 'Ключ регистрации должен содержать не менее 6 символов'),
  // School-specific fields (optional, only required for school keys)
  school_name: z.string().optional(),
  school_address: z.string().optional(),
  school_city: z.string().optional(),
  school_bin: z.string().optional(),
  school_type: z.string().optional(),
  students_count: z.coerce.number().optional(),
  teachers_count: z.coerce.number().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  contact_phone: z.string().optional(),
}).refine((_data) => {
  // If registrationKey exists, we'll validate school fields dynamically based on key type
  return true;
}, {
  message: "Все поля обязательны для регистрации школы",
});

type RoleRegValues = z.infer<typeof roleRegSchema>;

export default function RoleRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSchoolKey, setIsSchoolKey] = useState(false);
  const [keyRole, setKeyRole] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RoleRegValues>({
    resolver: zodResolver(roleRegSchema),
    defaultValues: {
      school_type: '',
      students_count: 50,
      teachers_count: 5,
    }
  });

  const registrationKey = watch('registrationKey');

  // Check key type when registration key changes
  const checkKeyType = async (key: string) => {
    if (!key || key.length < 6) {
      setIsSchoolKey(false);
      setKeyRole(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data: keyData, error: keyError } = await supabase
        .from('registration_keys')
        .select('role, school_id, teacher_id')
        .eq('key', key)
        .eq('is_active', true)
        .single();
      
      if (keyError || !keyData) {
        setIsSchoolKey(false);
        setKeyRole(null);
        return;
      }
      
      setKeyRole(keyData.role);
      setIsSchoolKey(keyData.role === 'school');
    } catch (error) {
      console.error('Error checking key type:', error);
      setIsSchoolKey(false);
      setKeyRole(null);
    }
  };

  // Debounced key checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (registrationKey) {
        checkKeyType(registrationKey);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [registrationKey]);

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
      
      // Validate key and get key details
      const { data: keyData, error: keyError } = await supabase
        .from('registration_keys')
        .select('role, school_id, teacher_id, is_active, max_uses, uses, expires_at')
        .eq('key', data.registrationKey)
        .single();
      
      if (keyError) {
        setError('Недействительный или неактивный ключ регистрации');
        return;
      }
      
      if (!keyData.is_active) {
        setError('Ключ регистрации деактивирован');
        return;
      }
      
      if (keyData.uses >= keyData.max_uses) {
        setError('Ключ регистрации исчерпал лимит использований');
        return;
      }
      
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        setError('Ключ регистрации истек');
        return;
      }
      
      // Handle school keys with school creation
      if (keyData.role === 'school') {
        // Validate required school fields
        if (!data.school_name || data.school_name.trim().length < 2) {
          setError('Название школы обязательно и должно содержать не менее 2 символов');
          return;
        }
        if (!data.school_city || data.school_city.trim().length < 2) {
          setError('Город обязателен');
          return;
        }
        if (!data.school_type) {
          setError('Выберите тип школы');
          return;
        }
        if (!data.students_count || data.students_count < 1) {
          setError('Количество студентов должно быть больше 0');
          return;
        }
        if (!data.teachers_count || data.teachers_count < 1) {
          setError('Количество учителей должно быть больше 0');
          return;
        }

        // Create school record first
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: data.school_name.trim(),
            address: data.school_address?.trim() || null,
            city: data.school_city.trim(),
            bin: data.school_bin?.trim() || null,
            school_type: data.school_type,
            max_students: data.students_count,
            max_teachers: data.teachers_count,
            website: data.website?.trim() || null,
            description: data.description?.trim() || null,
            contact_phone: data.contact_phone?.trim() || null,
            is_active: true,
            created_by: sessionData.session.user.id,
          })
          .select('id')
          .single();
        
        if (schoolError) {
          setError(`Ошибка создания школы: ${schoolError.message}`);
          return;
        }
        
        // Update user with school role and school association
        const { error: userError } = await supabase
          .from('users')
          .update({
            role: 'school',
            school_id: schoolData.id,
          })
          .eq('id', sessionData.session.user.id);
        
        if (userError) {
          setError(`Ошибка обновления пользователя: ${userError.message}`);
          return;
        }

        // Update key usage
        const { error: keyUpdateError } = await supabase
          .from('registration_keys')
          .update({ uses: keyData.uses + 1 })
          .eq('key', data.registrationKey);
        
        if (keyUpdateError) {
          console.warn('Не удалось обновить использование ключа:', keyUpdateError);
        }

        setSuccess('Школа успешно зарегистрирована! Перенаправление в панель управления...');
      } else {
        // For non-school roles, use the standard registration process
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
        } else {
          setError(result.message);
          return;
        }
      }

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (error) {
      setError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
      console.error('Registration error:', error);
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
          <Label htmlFor="registrationKey">
            Ключ Регистрации
          </Label>
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
          {keyRole && (
            <p className="mt-1 text-xs text-green-600">
              Обнаружен ключ роли: <span className="font-medium">{keyRole === 'school' ? 'Администратор школы' : keyRole}</span>
            </p>
          )}
        </div>

        {/* School Information Section - Only shown for school keys */}
        {isSchoolKey && (
          <div className="space-y-4 border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <School className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Информация о школе</h3>
            </div>

            <div>
              <Label htmlFor="school_name">
                <School className="h-4 w-4 inline mr-1" />
                Название школы *
              </Label>
              <Input
                id="school_name"
                type="text"
                {...register('school_name')}
                placeholder="Средняя школа №1"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school_city">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Город *
                </Label>
                <Input
                  id="school_city"
                  type="text"
                  {...register('school_city')}
                  placeholder="Алматы"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="school_type">Тип школы *</Label>
                <Controller
                  name="school_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Начальная школа</SelectItem>
                        <SelectItem value="middle">Средняя школа</SelectItem>
                        <SelectItem value="high">Старшая школа</SelectItem>
                        <SelectItem value="comprehensive">Общеобразовательная школа</SelectItem>
                        <SelectItem value="specialized">Специализированная школа</SelectItem>
                        <SelectItem value="private">Частная школа</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="school_address">
                <Building className="h-4 w-4 inline mr-1" />
                Адрес школы
              </Label>
              <Input
                id="school_address"
                type="text"
                {...register('school_address')}
                placeholder="ул. Пример, 123"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="students_count">
                  <Users className="h-4 w-4 inline mr-1" />
                  Количество студентов *
                </Label>
                <Input
                  id="students_count"
                  type="number"
                  min="1"
                  {...register('students_count')}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="teachers_count">
                  <User className="h-4 w-4 inline mr-1" />
                  Количество учителей *
                </Label>
                <Input
                  id="teachers_count"
                  type="number"
                  min="1"
                  {...register('teachers_count')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school_bin">БИН школы</Label>
                <Input
                  id="school_bin"
                  type="text"
                  {...register('school_bin')}
                  placeholder="123456789012"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Телефон
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  {...register('contact_phone')}
                  placeholder="+7 777 123 4567"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">
                <Globe className="h-4 w-4 inline mr-1" />
                Веб-сайт
              </Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://school.example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="description">Описание школы</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Расскажите о вашей школе..."
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
        
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
          {isLoading ? 'Обработка...' : (
            isSchoolKey ? 'Зарегистрировать школу' : 'Зарегистрироваться с Ключом'
          )}
        </Button>
      </form>
    </div>
  );
} 