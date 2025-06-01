-- 🔧 Скрипт исправления проблем базы данных
-- Выполните этот скрипт в Supabase Dashboard > SQL Editor

-- 1. Проверяем текущее состояние студентов без школы
SELECT 
    'Студенты без школы:' as info,
    COUNT(*) as count
FROM users 
WHERE role = 'student' AND school_id IS NULL;

-- 2. Получаем ID первой доступной школы
SELECT 
    'Доступные школы:' as info,
    id as school_id,
    name as school_name
FROM schools 
ORDER BY created_at 
LIMIT 5;

-- 3. Привязываем студентов без школы к первой доступной школе
-- ВНИМАНИЕ: Замените 'SCHOOL_ID_HERE' на реальный ID школы из предыдущего запроса
DO $$
DECLARE
    default_school_id UUID;
    students_updated INTEGER;
BEGIN
    -- Получаем ID первой школы
    SELECT id INTO default_school_id 
    FROM schools 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Если школа найдена, привязываем к ней студентов
    IF default_school_id IS NOT NULL THEN
        UPDATE users 
        SET school_id = default_school_id,
            updated_at = NOW()
        WHERE role = 'student' AND school_id IS NULL;
        
        GET DIAGNOSTICS students_updated = ROW_COUNT;
        
        RAISE NOTICE 'Привязано % студентов к школе %', students_updated, default_school_id;
    ELSE
        RAISE NOTICE 'Школы не найдены в системе';
    END IF;
END $$;

-- 4. Создаем ключи регистрации для super_admin
INSERT INTO registration_keys (
    role, 
    max_uses, 
    expires_at, 
    is_active,
    created_by,
    description
) VALUES 
('super_admin', 5, NOW() + INTERVAL '30 days', true, 
 (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
 'Ключи для регистрации суперадминистраторов'),
('super_admin', 10, NOW() + INTERVAL '90 days', true,
 (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), 
 'Долгосрочные ключи для суперадминистраторов');

-- 5. Проверяем результаты исправлений
SELECT 
    'Результаты исправления:' as info,
    role,
    COUNT(*) as total_users,
    COUNT(school_id) as users_with_school,
    COUNT(*) - COUNT(school_id) as users_without_school
FROM users 
GROUP BY role
ORDER BY role;

-- 6. Проверяем ключи регистрации
SELECT 
    'Ключи регистрации:' as info,
    role,
    COUNT(*) as total_keys,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
    COUNT(CASE WHEN uses < max_uses AND is_active = true THEN 1 END) as available_keys
FROM registration_keys 
GROUP BY role
ORDER BY role;

-- 7. Создаем функцию для проверки целостности данных
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Проверка студентов без школы
    RETURN QUERY
    SELECT 
        'students_without_school'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'::TEXT
            ELSE 'WARNING'::TEXT
        END,
        'Студентов без школы: ' || COUNT(*)::TEXT
    FROM users 
    WHERE role = 'student' AND school_id IS NULL;
    
    -- Проверка учителей без школы
    RETURN QUERY
    SELECT 
        'teachers_without_school'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'::TEXT
            ELSE 'WARNING'::TEXT
        END,
        'Учителей без школы: ' || COUNT(*)::TEXT
    FROM users 
    WHERE role = 'teacher' AND school_id IS NULL;
    
    -- Проверка активных ключей
    RETURN QUERY
    SELECT 
        'active_registration_keys'::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'OK'::TEXT
            ELSE 'ERROR'::TEXT
        END,
        'Активных ключей регистрации: ' || COUNT(*)::TEXT
    FROM registration_keys 
    WHERE is_active = true AND uses < max_uses;
    
    -- Проверка администраторов
    RETURN QUERY
    SELECT 
        'admin_users'::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'OK'::TEXT
            ELSE 'ERROR'::TEXT
        END,
        'Администраторов в системе: ' || COUNT(*)::TEXT
    FROM users 
    WHERE role IN ('super_admin', 'school');
    
END;
$$;

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION check_data_integrity() TO authenticated;

-- 8. Запускаем проверку целостности
SELECT * FROM check_data_integrity();

-- 9. Создаем представление для мониторинга системы
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'users_by_role' as metric_type,
    role as metric_name,
    COUNT(*)::TEXT as metric_value,
    CASE 
        WHEN role IN ('super_admin', 'school') AND COUNT(*) = 0 THEN 'CRITICAL'
        WHEN role IN ('teacher', 'author') AND COUNT(*) = 0 THEN 'WARNING'
        ELSE 'OK'
    END as status
FROM users 
GROUP BY role

UNION ALL

SELECT 
    'registration_keys' as metric_type,
    role as metric_name,
    COUNT(CASE WHEN is_active = true AND uses < max_uses THEN 1 END)::TEXT as metric_value,
    CASE 
        WHEN COUNT(CASE WHEN is_active = true AND uses < max_uses THEN 1 END) = 0 THEN 'WARNING'
        ELSE 'OK'
    END as status
FROM registration_keys 
GROUP BY role

UNION ALL

SELECT 
    'data_integrity' as metric_type,
    'students_without_school' as metric_name,
    COUNT(*)::TEXT as metric_value,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'WARNING'
    END as status
FROM users 
WHERE role = 'student' AND school_id IS NULL;

-- Предоставляем права на просмотр представления
GRANT SELECT ON system_health TO authenticated;

-- 10. Финальная проверка
SELECT 
    '=== ФИНАЛЬНАЯ ПРОВЕРКА ===' as summary,
    '' as details;

SELECT * FROM system_health ORDER BY metric_type, metric_name; 