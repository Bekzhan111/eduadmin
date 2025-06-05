const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function checkAuthors() {
  console.log('🔍 Проверяем существующих авторов...\n');
  
  const { data: authors, error } = await serviceClient
    .from('users')
    .select('id, email, role, created_at')
    .eq('role', 'author');
  
  if (error) {
    console.error('❌ Ошибка:', error);
    return;
  }
  
  console.log('📝 Найденные авторы:');
  authors.forEach((author, index) => {
    console.log(`${index + 1}. Email: ${author.email}`);
    console.log(`   ID: ${author.id}`);
    console.log(`   Создан: ${new Date(author.created_at).toLocaleString()}\n`);
  });
  
  if (authors.length === 0) {
    console.log('❌ Авторы не найдены. Создаем нового автора...');
    await createTestAuthor();
  } else {
    console.log('💡 Стандартный пароль для тестовых аккаунтов: "password123"');
  }
}

async function createTestAuthor() {
  console.log('🔄 Создаем тестового автора...');
  
  const { data, error } = await serviceClient.auth.admin.createUser({
    email: 'test-author@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      role: 'author',
      full_name: 'Тестовый Автор'
    }
  });
  
  if (error) {
    console.error('❌ Ошибка создания автора:', error);
    return;
  }
  
  // Добавляем в таблицу users
  const { error: insertError } = await serviceClient
    .from('users')
    .insert({
      id: data.user.id,
      email: data.user.email,
      role: 'author',
      full_name: 'Тестовый Автор'
    });
  
  if (insertError) {
    console.error('❌ Ошибка добавления в таблицу users:', insertError);
    return;
  }
  
  console.log('✅ Тестовый автор создан:');
  console.log(`   Email: test-author@example.com`);
  console.log(`   Пароль: password123`);
}

checkAuthors().then(() => process.exit(0)).catch(console.error); 