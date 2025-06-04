import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL не установлен');
}

if (!serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SERVICE_ROLE_KEY не установлен');
}

/**
 * Создание административного клиента Supabase с правами SERVICE_ROLE
 * ВНИМАНИЕ: Используйте только для серверных операций или когда RLS блокирует доступ
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для админ клиента');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Проверяет, нужно ли использовать административный клиент для данной роли
 */
export function shouldUseAdminClient(role?: string): boolean {
  // Временное решение: используем админ клиент для модераторов
  // чтобы обойти проблемы с RLS политиками
  return role === 'moderator';
}

/**
 * Получение книг с использованием правильного клиента в зависимости от роли
 */
export async function fetchBooksWithCorrectClient(
  role?: string,
  userId?: string,
  fallbackClient?: SupabaseClient
) {
  const useAdmin = shouldUseAdminClient(role);
  const client = useAdmin ? createAdminClient() : fallbackClient;
  
  if (!client) {
    throw new Error('Не удалось создать клиент Supabase');
  }
  
  console.log(`🔑 Using ${useAdmin ? 'ADMIN' : 'REGULAR'} client for role: ${role}`);
  
  let query = client
    .from('books')
    .select(`
      id,
      base_url,
      title,
      description,
      grade_level,
      course,
      category,
      status,
      author_id,
      moderator_id,
      created_at,
      updated_at,
      price,
      cover_image,
      file_size,
      pages_count,
      language,
      isbn,
      publisher,
      publication_date,
      downloads_count
    `);

  // Применяем фильтры в зависимости от роли
  switch (role) {
    case 'author':
      query = query.eq('author_id', userId);
      console.log('✍️ Author filter applied: author_id =', userId);
      break;
    case 'moderator':
      query = query.eq('status', 'Moderation');
      console.log('👨‍💼 Moderator filter applied: status = Moderation');
      break;
    case 'school':
    case 'teacher':
    case 'student':
      query = query.eq('status', 'Active');
      console.log('🎓 User filter applied: status = Active');
      break;
    case 'super_admin':
      console.log('👑 Super admin: no filters applied');
      break;
    default:
      query = query.eq('status', 'Active');
      console.log('🔓 Default filter applied: status = Active');
      break;
  }

  console.log('🚀 Executing query...');
  const result = await query.order('created_at', { ascending: false });
  
  console.log(`📊 Query result: ${result.data?.length || 0} books found${result.error ? ` (Error: ${result.error.message})` : ''}`);
  
  return result;
} 