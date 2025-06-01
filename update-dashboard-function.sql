-- Update dashboard summary function to include all necessary data
DROP FUNCTION IF EXISTS public.get_dashboard_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
    school_stats RECORD;
    key_stats RECORD;
    book_stats RECORD;
BEGIN
    -- Получаем информацию о пользователе
    SELECT u.role, u.school_id, s.name as school_name
    INTO user_record
    FROM users u
    LEFT JOIN schools s ON u.school_id = s.id
    WHERE u.id = user_id;

    -- Если пользователь не найден
    IF user_record IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- Базовая структура результата с ПРАВИЛЬНОЙ ролью пользователя
    result := json_build_object(
        'role', user_record.role,  -- ВАЖНО: используем роль из таблицы users
        'school_id', user_record.school_id,
        'school_name', user_record.school_name
    );

    -- Статистика в зависимости от роли
    CASE user_record.role
        WHEN 'super_admin' THEN
            -- Статистика для суперадминистратора
            SELECT 
                COUNT(DISTINCT s.id) as school_count,
                COUNT(DISTINCT u.id) as user_count,
                COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count
            INTO school_stats
            FROM schools s
            LEFT JOIN users u ON s.id = u.school_id;

            -- Статистика ключей для суперадминистратора
            SELECT 
                COUNT(CASE WHEN role = 'school' AND is_active = true AND uses < max_uses THEN 1 END) as school_keys,
                COUNT(CASE WHEN role = 'teacher' AND is_active = true AND uses < max_uses THEN 1 END) as teacher_keys,
                COUNT(CASE WHEN role = 'student' AND is_active = true AND uses < max_uses THEN 1 END) as student_keys,
                COUNT(CASE WHEN role = 'author' AND is_active = true AND uses < max_uses THEN 1 END) as author_keys,
                COUNT(CASE WHEN role = 'moderator' AND is_active = true AND uses < max_uses THEN 1 END) as moderator_keys
            INTO key_stats
            FROM registration_keys;

            result := result || json_build_object(
                'school_count', COALESCE(school_stats.school_count, 0),
                'user_count', COALESCE(school_stats.user_count, 0),
                'teacher_count', COALESCE(school_stats.teacher_count, 0),
                'student_count', COALESCE(school_stats.student_count, 0),
                'key_stats', json_build_object(
                    'school_keys', COALESCE(key_stats.school_keys, 0),
                    'teacher_keys', COALESCE(key_stats.teacher_keys, 0),
                    'student_keys', COALESCE(key_stats.student_keys, 0),
                    'author_keys', COALESCE(key_stats.author_keys, 0),
                    'moderator_keys', COALESCE(key_stats.moderator_keys, 0)
                )
            );

        WHEN 'school' THEN
            -- Статистика для администратора школы
            SELECT 
                COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
                s.student_quota
            INTO school_stats
            FROM schools s
            LEFT JOIN users u ON s.id = u.school_id
            WHERE s.id = user_record.school_id
            GROUP BY s.student_quota;

            -- Статистика ключей для школы
            SELECT 
                COUNT(CASE WHEN role = 'teacher' AND is_active = true AND uses < max_uses THEN 1 END) as teacher_keys,
                COUNT(CASE WHEN role = 'student' AND is_active = true AND uses < max_uses AND (school_id = user_record.school_id OR school_id IS NULL) THEN 1 END) as student_keys,
                COUNT(CASE WHEN role = 'student' AND is_active = true AND uses < max_uses AND school_id = user_record.school_id THEN 1 END) as assigned_keys,
                COUNT(CASE WHEN role = 'student' AND is_active = true AND uses < max_uses AND school_id IS NULL THEN 1 END) as unassigned_student_keys
            INTO key_stats
            FROM registration_keys
            WHERE created_by = user_id OR role IN ('teacher', 'student');

            result := result || json_build_object(
                'teacher_count', COALESCE(school_stats.teacher_count, 0),
                'student_count', COALESCE(school_stats.student_count, 0),
                'student_quota', COALESCE(school_stats.student_quota, 0),
                'key_stats', json_build_object(
                    'teacher_keys', COALESCE(key_stats.teacher_keys, 0),
                    'student_keys', COALESCE(key_stats.student_keys, 0),
                    'assigned_keys', COALESCE(key_stats.assigned_keys, 0),
                    'unassigned_student_keys', COALESCE(key_stats.unassigned_student_keys, 0)
                )
            );

        WHEN 'teacher' THEN
            -- Статистика для учителя
            SELECT 
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count
            INTO school_stats
            FROM users u
            WHERE u.school_id = user_record.school_id;

            result := result || json_build_object(
                'student_count', COALESCE(school_stats.student_count, 0)
            );

        WHEN 'student' THEN
            -- Статистика для студента
            SELECT 
                COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as teacher_count,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count
            INTO school_stats
            FROM users u
            WHERE u.school_id = user_record.school_id;

            result := result || json_build_object(
                'teacher_count', COALESCE(school_stats.teacher_count, 0),
                'student_count', COALESCE(school_stats.student_count, 0)
            );

        WHEN 'author' THEN
            -- Статистика для автора контента
            SELECT 
                COUNT(*) as total_books,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_books,
                COUNT(CASE WHEN status = 'moderation' THEN 1 END) as moderation_books,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_books,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_books
            INTO book_stats
            FROM books
            WHERE author_id = user_id;

            result := result || json_build_object(
                'book_stats', json_build_object(
                    'total_books', COALESCE(book_stats.total_books, 0),
                    'draft_books', COALESCE(book_stats.draft_books, 0),
                    'moderation_books', COALESCE(book_stats.moderation_books, 0),
                    'active_books', COALESCE(book_stats.active_books, 0),
                    'approved_books', COALESCE(book_stats.approved_books, 0)
                )
            );

        WHEN 'moderator' THEN
            -- Статистика для модератора
            SELECT 
                COUNT(*) as total_books,
                COUNT(CASE WHEN status = 'moderation' THEN 1 END) as moderation_books,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_books,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_books
            INTO book_stats
            FROM books;

            -- Статистика отзывов за неделю
            SELECT COUNT(*) as weekly_reviews
            INTO key_stats
            FROM book_reviews
            WHERE created_at >= NOW() - INTERVAL '7 days';

            result := result || json_build_object(
                'book_stats', json_build_object(
                    'total_books', COALESCE(book_stats.total_books, 0),
                    'moderation_books', COALESCE(book_stats.moderation_books, 0),
                    'active_books', COALESCE(book_stats.active_books, 0),
                    'approved_books', COALESCE(book_stats.approved_books, 0),
                    'weekly_reviews', COALESCE(key_stats.weekly_reviews, 0)
                )
            );

        ELSE
            -- Для неизвестных ролей
            result := result || json_build_object('message', 'Unknown role');
    END CASE;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;

-- Проверяем функцию
SELECT 'Функция get_dashboard_summary успешно обновлена' as status; 