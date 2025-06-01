const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function checkAuthorRole() {
  console.log('🔍 Проверка всех авторов в базе данных\n');
  
  try {
    // Ищем всех пользователей с ролью author
    const { data: authors, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'author');
      
    if (error) {
      console.error('❌ Ошибка получения авторов:', error.message);
      return;
    }
    
    if (!authors || authors.length === 0) {
      console.log('⚠️ Авторы не найдены в базе данных');
      return;
    }
    
    console.log(`📊 Найдено авторов: ${authors.length}\n`);
    
    for (const author of authors) {
      console.log(`👤 Автор: ${author.email}`);
      console.log(`   ID: ${author.id}`);
      console.log(`   Роль в таблице users: ${author.role}`);
      
      // Проверяем функцию dashboard для каждого автора
      const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_dashboard_summary', {
        user_id: author.id
      });
      
      if (dashboardError) {
        console.error(`   ❌ Ошибка функции dashboard: ${dashboardError.message}`);
      } else {
        console.log(`   Роль в ответе функции: ${dashboardData?.role}`);
        console.log(`   Правильно ли: ${dashboardData?.role === 'author' ? '✅ ДА' : '❌ НЕТ'}`);
        
        if (dashboardData?.role !== 'author') {
          console.log('   🚨 ПРОБЛЕМА: Функция возвращает неправильную роль!');
        }
      }
      console.log('');
    }
    
    // Также проверим пользователей с email содержащим "test-author"
    console.log('🔍 Поиск тестовых авторов...\n');
    const { data: testAuthors, error: testError } = await supabase
      .from('users')
      .select('id, email, role')
      .like('email', '%test-author%');
      
    if (testError) {
      console.error('❌ Ошибка поиска тестовых авторов:', testError.message);
    } else if (testAuthors && testAuthors.length > 0) {
      console.log(`📊 Найдено тестовых пользователей: ${testAuthors.length}\n`);
      
      for (const user of testAuthors) {
        console.log(`👤 Тестовый пользователь: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Роль: ${user.role}`);
        console.log('');
      }
    } else {
      console.log('⚠️ Тестовые авторы не найдены');
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

checkAuthorRole(); 