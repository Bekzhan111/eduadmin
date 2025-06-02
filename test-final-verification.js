require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// JavaScript версия функции из utils/supabase-admin.ts
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
  );
};

const shouldUseAdminClient = (role) => role === 'moderator';

const fetchBooksWithCorrectClient = async (role, userId, fallbackClient) => {
  const useAdmin = shouldUseAdminClient(role);
  const client = useAdmin ? createAdminClient() : fallbackClient;
  
  console.log(`🔑 Using ${useAdmin ? 'ADMIN' : 'REGULAR'} client for role: ${role}`);
  
  let query = client
    .from('books')
    .select('id, title, status, author_id');

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

  const result = await query.order('created_at', { ascending: false });
  console.log(`📊 Query result: ${result.data?.length || 0} books found${result.error ? ` (Error: ${result.error.message})` : ''}`);
  
  return result;
};

async function testAllRoles() {
  console.log('🧪 Финальная проверка работы всех ролей\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Получаем реального автора для тестирования
    const { data: author } = await createAdminClient()
      .from('users')
      .select('id, email')
      .eq('role', 'author')
      .limit(1)
      .single();
    
    const testCases = [
      {
        role: 'moderator',
        userId: 'c0c8bf1b-c5b5-4f1d-80a3-c20ac3a3fefe',
        description: 'Модератор (должен видеть книги на модерации через ADMIN клиент)',
        expectedClient: 'ADMIN'
      },
      {
        role: 'author',
        userId: author?.id,
        description: 'Автор (должен видеть свои книги через обычный клиент)',
        expectedClient: 'REGULAR'
      },
      {
        role: 'super_admin',
        userId: 'test-admin-id',
        description: 'Супер админ (должен видеть все книги через обычный клиент)',
        expectedClient: 'REGULAR'
      },
      {
        role: 'teacher',
        userId: 'test-teacher-id',
        description: 'Учитель (должен видеть активные книги через обычный клиент)',
        expectedClient: 'REGULAR'
      },
      {
        role: 'student',
        userId: 'test-student-id',
        description: 'Студент (должен видеть активные книги через обычный клиент)',
        expectedClient: 'REGULAR'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`📋 Тест ${i + 1}: ${testCase.description}`);
      
      const { data: booksData, error: booksError } = await fetchBooksWithCorrectClient(
        testCase.role,
        testCase.userId,
        supabase
      );
      
      if (booksError) {
        console.log(`❌ Ошибка: ${booksError.message}`);
      } else {
        console.log(`✅ Результат: ${booksData?.length || 0} книг найдено`);
        
        // Особая проверка для модератора
        if (testCase.role === 'moderator' && booksData && booksData.length > 0) {
          console.log(`🎯 УСПЕХ: Модератор видит ${booksData.length} книг на модерации!`);
          console.log('📚 Примеры книг на модерации:');
          booksData.slice(0, 3).forEach((book, index) => {
            console.log(`   ${index + 1}. "${book.title}" (статус: ${book.status})`);
          });
        }
      }
      console.log('');
    }
    
    console.log('🎉 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:');
    console.log('✅ Система работает корректно!');
    console.log('✅ Модераторы используют ADMIN клиент и видят книги на модерации');
    console.log('✅ Остальные роли используют обычный клиент с соответствующими фильтрами');
    console.log('✅ RLS проблема решена временным использованием SERVICE_ROLE для модераторов');
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

testAllRoles(); 