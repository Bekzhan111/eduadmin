const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkBooksRLS() {
  console.log('🔐 Проверяем RLS политики для таблицы books...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Проверяем возможность чтения таблицы books
    console.log('📋 Шаг 1: Проверка чтения таблицы books');
    const { data: books, error: readError } = await supabase
      .from('books')
      .select('id, title, status, author_id')
      .limit(5);
    
    if (readError) {
      console.log('❌ Ошибка чтения books:', readError.message);
    } else {
      console.log('✅ Успешно прочитано книг:', books.length);
      books.forEach(book => {
        console.log(`  - ${book.title} (Статус: ${book.status})`);
      });
    }
    
    // Проверяем информацию о текущем пользователе
    console.log('\n📋 Шаг 2: Информация о текущем сеансе');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Ошибка получения сессии:', sessionError.message);
    } else if (!session.session) {
      console.log('⚠️ Нет активной сессии - используется анонимный доступ');
      console.log('🔑 Для создания книг нужна авторизация как автор');
    } else {
      console.log('✅ Активная сессия найдена для:', session.session.user.email);
    }
    
    // Попробуем получить информацию о пользователе
    console.log('\n📋 Шаг 3: Проверка профиля пользователя');
    if (session.session) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', session.session.user.id)
        .single();
      
      if (userError) {
        console.log('❌ Ошибка получения профиля:', userError.message);
      } else {
        console.log('✅ Профиль пользователя:', userData);
      }
    }
    
    console.log('\n💡 Рекомендации:');
    console.log('   1. Для создания книг нужно войти в систему как автор');
    console.log('   2. RLS политики защищают таблицу books от неавторизованного доступа');
    console.log('   3. В веб-приложении используется AuthContext для аутентификации');
    
  } catch (error) {
    console.error('💥 Ошибка проверки:', error.message);
  }
}

checkBooksRLS(); 