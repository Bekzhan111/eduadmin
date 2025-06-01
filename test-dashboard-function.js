const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

console.log('🧪 Тестирование функции get_dashboard_summary\n');

async function testDashboardFunction() {
  try {
    // Получаем всех пользователей для тестирования
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .order('role, created_at');

    if (usersError) {
      console.error('❌ Ошибка получения пользователей:', usersError.message);
      return;
    }

    console.log(`📊 Найдено пользователей: ${users?.length || 0}\n`);

    // Группируем по ролям
    const usersByRole = {};
    users?.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Тестируем функцию для каждой роли
    for (const [role, roleUsers] of Object.entries(usersByRole)) {
      console.log(`🔍 Тестирование роли: ${role.toUpperCase()}`);
      
      if (roleUsers.length === 0) {
        console.log('  ⚠️ Пользователи с этой ролью не найдены\n');
        continue;
      }

      // Берем первого пользователя этой роли
      const testUser = roleUsers[0];
      console.log(`  👤 Тестируем пользователя: ${testUser.email} (${testUser.id})`);

      // Вызываем функцию
      const { data: result, error } = await supabase.rpc('get_dashboard_summary', {
        user_id: testUser.id
      });

      if (error) {
        console.error(`  ❌ Ошибка функции:`, error.message);
      } else {
        console.log(`  ✅ Результат функции:`);
        console.log(`     Роль в ответе: ${result?.role || 'НЕ ОПРЕДЕЛЕНА'}`);
        console.log(`     Роль пользователя: ${testUser.role}`);
        console.log(`     Совпадение: ${result?.role === testUser.role ? '✅ ДА' : '❌ НЕТ'}`);
        
        if (result?.school_name) {
          console.log(`     Школа: ${result.school_name}`);
        }
        
        // Показываем дополнительную статистику в зависимости от роли
        if (result?.book_stats) {
          console.log(`     Книги: ${JSON.stringify(result.book_stats)}`);
        }
        if (result?.key_stats) {
          console.log(`     Ключи: ${JSON.stringify(result.key_stats)}`);
        }
        if (result?.teacher_count !== undefined) {
          console.log(`     Учителей: ${result.teacher_count}`);
        }
        if (result?.student_count !== undefined) {
          console.log(`     Студентов: ${result.student_count}`);
        }
      }
      console.log('');
    }

    // Проверяем конкретно автора, если есть
    const authors = usersByRole['author'];
    if (authors && authors.length > 0) {
      console.log('🎯 Специальная проверка для АВТОРА:');
      const author = authors[0];
      
      const { data: result, error } = await supabase.rpc('get_dashboard_summary', {
        user_id: author.id
      });

      if (error) {
        console.error('❌ Ошибка при проверке автора:', error.message);
      } else {
        console.log('✅ Результат для автора:');
        console.log(`   Email: ${author.email}`);
        console.log(`   ID: ${author.id}`);
        console.log(`   Роль в БД: ${author.role}`);
        console.log(`   Роль в ответе функции: ${result?.role}`);
        console.log(`   Правильно ли: ${result?.role === 'author' ? '✅ ДА' : '❌ НЕТ'}`);
        
        if (result?.role !== 'author') {
          console.log('🚨 ПРОБЛЕМА: Функция возвращает неправильную роль!');
          console.log('   Полный ответ функции:', JSON.stringify(result, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error);
  }
}

// Запускаем тест
testDashboardFunction(); 