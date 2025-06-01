const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

console.log('👤 Создание тестового автора\n');

async function createTestAuthor() {
  try {
    // 1. Получаем доступный ключ для автора
    const { data: allAuthorKeys, error: keysError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('role', 'author')
      .eq('is_active', true);

    if (keysError) {
      console.error('❌ Ошибка получения ключей:', keysError.message);
      return;
    }

    // Фильтруем ключи, которые еще можно использовать
    const authorKeys = allAuthorKeys?.filter(key => key.uses < key.max_uses) || [];

    if (authorKeys.length === 0) {
      console.error('❌ Нет доступных ключей для автора');
      return;
    }

    const authorKey = authorKeys[0];
    console.log(`🔑 Используем ключ: ${authorKey.key}`);

    // 2. Создаем тестового пользователя-автора
    const testEmail = `test-author-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`📧 Создаем автора: ${testEmail}`);

    // Создаем пользователя через Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Ошибка создания пользователя в Auth:', authError.message);
      return;
    }

    console.log(`✅ Пользователь создан в Auth: ${authData.user.id}`);

    // 3. Проверяем, существует ли пользователь в таблице users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Ошибка проверки пользователя:', checkError.message);
      return;
    }

    if (existingUser) {
      console.log(`✅ Пользователь уже существует в таблице users`);
      console.log(`   Текущая роль: ${existingUser.role}`);
      
      // Обновляем роль на author, если она другая
      if (existingUser.role !== 'author') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'author' })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('❌ Ошибка обновления роли:', updateError.message);
          return;
        }
        console.log(`✅ Роль обновлена на 'author'`);
      }
    } else {
      // Добавляем пользователя в таблицу users с ролью author
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testEmail,
          role: 'author',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ Ошибка добавления в таблицу users:', userError.message);
        return;
      }

      console.log(`✅ Пользователь добавлен в таблицу users`);
    }

    // 4. Отмечаем ключ как использованный
    const { error: keyUpdateError } = await supabase
      .from('registration_keys')
      .update({ 
        uses: authorKey.uses + 1,
        used_at: new Date().toISOString()
      })
      .eq('id', authorKey.id);

    if (keyUpdateError) {
      console.error('❌ Ошибка обновления ключа:', keyUpdateError.message);
    } else {
      console.log(`✅ Ключ отмечен как использованный`);
    }

    // 5. Тестируем функцию dashboard для нового автора
    console.log('\n🧪 Тестируем функцию dashboard для нового автора...');
    
    const { data: dashboardResult, error: dashboardError } = await supabase.rpc('get_dashboard_summary', {
      user_id: authData.user.id
    });

    if (dashboardError) {
      console.error('❌ Ошибка функции dashboard:', dashboardError.message);
    } else {
      console.log('✅ Результат функции dashboard:');
      console.log(`   Роль в ответе: ${dashboardResult?.role}`);
      console.log(`   Ожидаемая роль: author`);
      console.log(`   Правильно: ${dashboardResult?.role === 'author' ? '✅ ДА' : '❌ НЕТ'}`);
      
      if (dashboardResult?.book_stats) {
        console.log(`   Статистика книг: ${JSON.stringify(dashboardResult.book_stats)}`);
      }
    }

    // 6. Выводим данные для входа
    console.log('\n🎯 Данные для тестирования:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Роль: author`);
    console.log('\n📱 Теперь можете войти в систему и проверить Dashboard!');

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

// Запускаем создание
createTestAuthor(); 