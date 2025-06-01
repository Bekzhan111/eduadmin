-- 🔧 Создание ключей для super_admin через SQL
-- Выполните этот скрипт в Supabase Dashboard > SQL Editor

-- 1. Проверяем текущие ограничения на роли
SELECT 
    'Проверка ограничений роли:' as info,
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%role%' 
AND conrelid = 'registration_keys'::regclass;

-- 2. Проверяем допустимые значения роли
SELECT 
    'Допустимые роли:' as info,
    unnest(enum_range(NULL::user_role)) as allowed_roles;

-- 3. Получаем ID администратора для created_by
SELECT 
    'Администраторы в системе:' as info,
    id,
    email,
    role
FROM users 
WHERE role IN ('super_admin', 'school')
ORDER BY role, created_at
LIMIT 5;

-- 4. Создаем ключи для super_admin
DO $$
DECLARE
    admin_id UUID;
    keys_created INTEGER := 0;
BEGIN
    -- Получаем ID первого super_admin
    SELECT id INTO admin_id 
    FROM users 
    WHERE role = 'super_admin'
    ORDER BY created_at 
    LIMIT 1;
    
    -- Если super_admin не найден, используем school admin
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id 
        FROM users 
        WHERE role = 'school'
        ORDER BY created_at 
        LIMIT 1;
    END IF;
    
    IF admin_id IS NOT NULL THEN
        -- Создаем 5 ключей для super_admin
        FOR i IN 1..5 LOOP
            INSERT INTO registration_keys (
                key,
                role,
                max_uses,
                expires_at,
                is_active,
                created_by,
                uses
            ) VALUES (
                'SA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)),
                'super_admin'::user_role,
                3,
                NOW() + INTERVAL '90 days',
                true,
                admin_id,
                0
            );
            keys_created := keys_created + 1;
        END LOOP;
        
        RAISE NOTICE 'Создано % ключей для super_admin, created_by: %', keys_created, admin_id;
    ELSE
        RAISE NOTICE 'Администраторы не найдены в системе';
    END IF;
END $$;

-- 5. Проверяем созданные ключи
SELECT 
    'Созданные ключи super_admin:' as info,
    key,
    max_uses,
    uses,
    expires_at::date as expires_date,
    is_active
FROM registration_keys 
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- 6. Итоговая статистика по всем ролям
SELECT 
    'Итоговая статистика ключей:' as info,
    role,
    COUNT(*) as total_keys,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
    COUNT(CASE WHEN is_active = true AND uses < max_uses AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as available_keys
FROM registration_keys 
GROUP BY role
ORDER BY role;

-- 7. Создаем представление для удобного просмотра ключей
CREATE OR REPLACE VIEW available_keys AS
SELECT 
    role,
    key,
    max_uses,
    uses,
    (max_uses - uses) as remaining_uses,
    expires_at::date as expires_date,
    CASE 
        WHEN NOT is_active THEN 'Неактивен'
        WHEN uses >= max_uses THEN 'Исчерпан'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Истек'
        ELSE 'Доступен'
    END as status
FROM registration_keys
WHERE is_active = true 
AND uses < max_uses 
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY role, expires_at;

-- Предоставляем права на просмотр
GRANT SELECT ON available_keys TO authenticated;

-- 8. Показываем доступные ключи
SELECT * FROM available_keys; 