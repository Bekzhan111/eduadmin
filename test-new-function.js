require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// JavaScript версия функции для тестирования
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для админ клиента');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function shouldUseAdminClient(role) {
  return role === 'moderator';
}

async function fetchBooksWithCorrectClient(role, userId, fallbackClient) {
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

async function testNewFunction() {
  console.log('🧪 Тестируем новую функцию fetchBooksWithCorrectClient');
  
  try {
    // Создаем обычный клиент
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('\n📋 Тест 1: Модератор (должен использовать ADMIN клиент)');
    const moderatorResult = await fetchBooksWithCorrectClient('moderator', 'test-user-id', supabase);
    console.log('✅ Результат для модератора:', moderatorResult.data?.length || 0, 'книг');
    if (moderatorResult.error) {
      console.error('❌ Ошибка модератора:', moderatorResult.error.message);
    }
    
    console.log('\n📋 Тест 2: Автор (должен использовать обычный клиент)');
    const authorResult = await fetchBooksWithCorrectClient('author', 'test-user-id', supabase);
    console.log('✅ Результат для автора:', authorResult.data?.length || 0, 'книг');
    if (authorResult.error) {
      console.error('❌ Ошибка автора:', authorResult.error.message);
    }
    
    console.log('\n📋 Тест 3: Супер админ (должен использовать обычный клиент)');
    const adminResult = await fetchBooksWithCorrectClient('super_admin', 'test-user-id', supabase);
    console.log('✅ Результат для админа:', adminResult.data?.length || 0, 'книг');
    if (adminResult.error) {
      console.error('❌ Ошибка админа:', adminResult.error.message);
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

testNewFunction(); 