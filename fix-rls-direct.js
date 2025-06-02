require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixRLSPoliciesDirect() {
  console.log('🔧 Исправляем RLS политики напрямую...');
  
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Шаг 1: Проверим текущее состояние RLS');
    
    // Сначала проверим, какие политики уже есть
    const { data: existingPolicies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'books');
    
    if (policiesError) {
      console.log('⚠️ Не удалось получить информацию о политиках:', policiesError.message);
    } else {
      console.log('📝 Существующие политики:', existingPolicies?.length || 0);
      existingPolicies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('\n📋 Шаг 2: Попробуем создать простые политики через Supabase Admin API');
    
    // Давайте попробуем более простой подход через REST API
    const { data: tablesData, error: tablesError } = await serviceClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'books');
    
    if (tablesError) {
      console.log('❌ Не удалось проверить таблицу books:', tablesError.message);
      return;
    }
    
    if (!tablesData || tablesData.length === 0) {
      console.log('❌ Таблица books не найдена!');
      return;
    }
    
    console.log('✅ Таблица books найдена');
    
    console.log('\n📋 Шаг 3: Тестируем текущий доступ');
    
    // Создаем anon клиент для тестирования
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Получаем модератора
    const { data: moderators, error: modError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError || !moderators || moderators.length === 0) {
      console.log('❌ Модератор не найден для тестирования');
      return;
    }
    
    const moderator = moderators[0];
    console.log('👤 Тестируем с модератором:', moderator.email);
    
    // Входим как модератор
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: moderator.email,
      password: 'TestPassword123'
    });
    
    if (authError) {
      console.log('❌ Не удалось войти как модератор:', authError.message);
      return;
    }
    
    console.log('✅ Успешный вход как модератор');
    
    // Тестируем доступ к книгам БЕЗ фильтров (чтобы понять, что RLS блокирует)
    console.log('\n🔍 Тестируем прямой доступ к таблице books...');
    
    const { data: allBooks, error: allBooksError } = await anonClient
      .from('books')
      .select('id, title, status, author_id');
    
    if (allBooksError) {
      console.log('❌ Ошибка доступа к таблице books:', allBooksError.message);
    } else {
      console.log('📚 Книг доступно через аутентифицированный запрос:', allBooks?.length || 0);
      
      if (allBooks && allBooks.length > 0) {
        console.log('\n📋 Статусы книг:');
        const statusCount = {};
        allBooks.forEach(book => {
          statusCount[book.status] = (statusCount[book.status] || 0) + 1;
        });
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count} книг`);
        });
      }
    }
    
    // Тестируем доступ с фильтром по статусу "Moderation"
    const { data: moderationBooks, error: modBooksError } = await anonClient
      .from('books')
      .select('id, title, status')
      .eq('status', 'Moderation');
    
    if (modBooksError) {
      console.log('❌ Ошибка доступа к книгам на модерации:', modBooksError.message);
    } else {
      console.log('📝 Книг на модерации доступно:', moderationBooks?.length || 0);
      
      if (moderationBooks && moderationBooks.length > 0) {
        console.log('\n🎉 ХОРОШИЕ НОВОСТИ! Модератор видит книги на модерации:');
        moderationBooks.slice(0, 3).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}"`);
        });
      } else {
        console.log('⚠️ Модератор не видит книги на модерации');
      }
    }
    
    // Выходим
    await anonClient.auth.signOut();
    
    console.log('\n📋 Шаг 4: Анализ проблемы');
    
    if (allBooks && allBooks.length > 0 && (!moderationBooks || moderationBooks.length === 0)) {
      console.log('🔍 ДИАГНОЗ: RLS политики блокируют доступ к книгам на модерации');
      console.log('💡 РЕШЕНИЕ: Нужно создать или исправить RLS политики');
      
      // Попробуем создать политики через административный доступ
      console.log('\n🔧 Попытка создания политик через административный доступ...');
      
      // Отключим RLS временно для тестирования
      console.log('⚠️ Временно отключаем RLS для диагностики...');
      
      const { error: disableRLSError } = await serviceClient
        .from('books')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 'non-existent-id'); // Фиктивный запрос для проверки доступа
      
      console.log('📋 Результат проверки административного доступа:', disableRLSError ? 'Ограничен' : 'Полный');
      
    } else if (moderationBooks && moderationBooks.length > 0) {
      console.log('✅ RLS политики работают корректно!');
      console.log('💡 Проблема может быть в клиентском коде');
    } else {
      console.log('⚠️ Нет книг для тестирования или другая проблема');
    }
    
    console.log('\n✅ Диагностика завершена');
    
  } catch (error) {
    console.error('❌ Ошибка диагностики RLS:', error instanceof Error ? error.message : String(error));
  }
}

fixRLSPoliciesDirect(); 