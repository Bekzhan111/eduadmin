require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testModeratorAccess() {
  console.log('🔍 Простой тест доступа модератора к книгам...');
  
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('📋 Шаг 1: Получаем модератора для тестирования');
    
    const { data: moderators, error: modError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError || !moderators || moderators.length === 0) {
      console.log('❌ Модератор не найден:', modError?.message);
      return;
    }
    
    const moderator = moderators[0];
    console.log('✅ Модератор найден:', moderator.email);
    
    console.log('\n📋 Шаг 2: Проверяем книги через SERVICE_ROLE ключ');
    
    const { data: serviceBooks, error: serviceBooksError } = await serviceClient
      .from('books')
      .select('id, title, status')
      .eq('status', 'Moderation');
    
    if (serviceBooksError) {
      console.log('❌ Ошибка получения книг через SERVICE_ROLE:', serviceBooksError.message);
    } else {
      console.log('📚 Книг на модерации (SERVICE_ROLE):', serviceBooks?.length || 0);
    }
    
    console.log('\n📋 Шаг 3: Вход как модератор через ANON ключ');
    
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: moderator.email,
      password: 'TestPassword123'
    });
    
    if (authError) {
      console.log('❌ Ошибка входа:', authError.message);
      return;
    }
    
    console.log('✅ Успешный вход');
    
    const { data: session, error: sessionError } = await anonClient.auth.getSession();
    
    if (sessionError || !session.session) {
      console.log('❌ Ошибка получения сессии:', sessionError?.message);
      return;
    }
    
    console.log('✅ Сессия активна, пользователь:', session.session.user.email);
    
    console.log('\n📋 Шаг 4: Проверяем книги через аутентифицированный ANON ключ');
    
    const { data: allBooks, error: allBooksError } = await anonClient
      .from('books')
      .select('id, title, status, author_id');
    
    if (allBooksError) {
      console.log('❌ Ошибка получения всех книг:', allBooksError.message);
    } else {
      console.log('📚 Всего книг доступно:', allBooks?.length || 0);
      
      if (allBooks && allBooks.length > 0) {
        const statusCount = {};
        allBooks.forEach(book => {
          statusCount[book.status] = (statusCount[book.status] || 0) + 1;
        });
        console.log('📊 По статусам:');
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count} книг`);
        });
      }
    }
    
    const { data: moderationBooks, error: modBooksError } = await anonClient
      .from('books')
      .select('id, title, status')
      .eq('status', 'Moderation');
    
    if (modBooksError) {
      console.log('❌ Ошибка получения книг на модерации:', modBooksError.message);
    } else {
      console.log('📝 Книг на модерации доступно:', moderationBooks?.length || 0);
      
      if (moderationBooks && moderationBooks.length > 0) {
        console.log('\n✅ УСПЕХ! Модератор видит книги на модерации:');
        moderationBooks.slice(0, 5).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}" (${book.id})`);
        });
      }
    }
    
    console.log('\n📋 Шаг 5: Сравнение результатов');
    
    const serviceCount = serviceBooks?.length || 0;
    const anonCount = moderationBooks?.length || 0;
    
    console.log(`📊 SERVICE_ROLE видит: ${serviceCount} книг`);
    console.log(`📊 Аутентифицированный ANON видит: ${anonCount} книг`);
    
    if (serviceCount > 0 && anonCount === 0) {
      console.log('\n🔍 ДИАГНОЗ: RLS политики блокируют доступ модератора');
      
      const { data: userProfile, error: profileError } = await anonClient
        .from('users')
        .select('id, email, role')
        .eq('id', session.session.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Ошибка получения профиля:', profileError.message);
      } else {
        console.log('👤 Профиль пользователя:', userProfile);
      }
      
    } else if (serviceCount > 0 && anonCount > 0) {
      console.log('\n✅ ОТЛИЧНО! RLS политики работают корректно');
    }
    
    await anonClient.auth.signOut();
    console.log('\n✅ Тестирование завершено');
    
  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

testModeratorAccess(); 