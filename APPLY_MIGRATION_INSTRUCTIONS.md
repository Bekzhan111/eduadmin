# Инструкции по применению SQL миграции

## ⚠️ ВАЖНО: Проблема решена частично

✅ **Что уже исправлено:**
- Очищены тестовые данные из таблицы `users`
- Удалены лишние пользователи из `auth.users` 
- Исправлен код AuthContext для корректной обработки ошибок
- Обновлен код приложения для использования новой функции

❌ **Что нужно сделать:**
- Применить SQL миграцию через Supabase Dashboard

## Проблема
Функция `register_with_key` имеет конфликт в базе данных. Создана временная функция `register_user_with_key` для решения проблемы.

## Шаги для применения миграции

### 1. Откройте Supabase Dashboard
- Перейдите на https://supabase.com/dashboard
- Войдите в свой проект

### 2. Откройте SQL Editor
- В левом меню выберите "SQL Editor"
- Нажмите "New query"

### 3. Скопируйте и выполните SQL код

```sql
-- Создаем временную функцию с другим именем для обхода конфликта
CREATE OR REPLACE FUNCTION public.register_user_with_key(
  registration_key text,
  user_id uuid,
  display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record RECORD;
  user_record RECORD;
BEGIN
  -- Проверяем существование и валидность ключа регистрации
  SELECT * INTO key_record
  FROM registration_keys
  WHERE key = registration_key
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND uses < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired registration key'
    );
  END IF;

  -- Проверяем, не зарегистрирован ли уже пользователь
  SELECT * INTO user_record
  FROM users
  WHERE id = user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already registered'
    );
  END IF;

  -- Добавляем нового пользователя
  INSERT INTO users (
    id,
    email,
    display_name,
    role,
    school_id,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    (SELECT email FROM auth.users WHERE id = user_id),
    display_name,
    key_record.role,
    CASE 
      WHEN key_record.role IN ('teacher', 'student') THEN key_record.school_id
      ELSE NULL
    END,
    NOW(),
    NOW()
  );

  -- Обновляем счетчик использований ключа
  UPDATE registration_keys
  SET uses = uses + 1,
      updated_at = NOW()
  WHERE key = registration_key;

  -- Возвращаем успешный результат
  RETURN json_build_object(
    'success', true,
    'user_id', user_id,
    'role', key_record.role,
    'school_id', key_record.school_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Предоставляем права выполнения
GRANT EXECUTE ON FUNCTION public.register_user_with_key(text, uuid, text) TO authenticated;
```

### 4. Выполните запрос
- Нажмите кнопку "Run" или используйте Ctrl+Enter
- Убедитесь, что запрос выполнился без ошибок

### 5. Проверьте результат
- Функция `register_user_with_key` должна быть создана
- Приложение уже настроено на использование этой функции

## Что было сделано в коде

1. **Очищены тестовые данные**: 
   - Удалены все пользователи кроме super_admin из таблицы `users`
   - Удалены 20 лишних пользователей из `auth.users`
   - Сброшены счетчики использования ключей регистрации

2. **Исправлен AuthContext**: 
   - Заменен `.single()` на `.maybeSingle()` для корректной обработки отсутствующих пользователей
   - Добавлена проверка на случай, когда пользователь есть в auth, но нет в таблице users

3. **Обновлен код**: Приложение теперь использует `register_user_with_key` вместо `register_with_key`

## Файлы, которые были изменены

- `src/app/register/page.tsx` - изменен вызов функции
- `src/components/auth/login-form.tsx` - изменен вызов функции  
- `src/contexts/AuthContext.tsx` - исправлена обработка ошибок

## После применения миграции

1. **Перезапустите сервер разработки**: 
   ```bash
   npm run dev
   ```

2. **Попробуйте зарегистрировать нового пользователя**

3. **Проверьте, что регистрация работает корректно**

## Проверка работы

После применения миграции используйте один из ключей регистрации для тестирования:
- Школьный ключ: `2OJ-NCK-JJK-HR5`
- Универсальный ключ: `0000-0000-0000-0000`

## Если проблемы продолжаются

1. Проверьте логи в консоли браузера
2. Убедитесь, что функция создана в Supabase Dashboard
3. Перезапустите сервер разработки

## Текущее состояние

✅ База данных очищена и синхронизирована  
✅ Код приложения обновлен  
✅ AuthContext исправлен  
❌ SQL миграция требует ручного применения через Dashboard 