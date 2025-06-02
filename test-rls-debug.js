require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testRLSPolicies() {
  console.log('🔒 Тестируем RLS политики для таблицы books...');
  
  try {
    // Создаем два клиента - один с anon ключом, другой с service_role
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Шаг 1: Проверка доступа с ANON ключом');
    const { data: anonBooks, error: anonError } = await anonClient
      .from('books')
      .select('id, title, status, author_id')
      .eq('status', 'Moderation');
    
    if (anonError) {
      console.log('❌ Ошибка с ANON ключом:', anonError.message);
    } else {
      console.log('✅ С ANON ключом видно книг:', anonBooks?.length || 0);
    }
    
    console.log('\n📋 Шаг 2: Проверка доступа с SERVICE_ROLE ключом');
    const { data: serviceBooks, error: serviceError } = await serviceClient
      .from('books')
      .select('id, title, status, author_id')
      .eq('status', 'Moderation');
    
    if (serviceError) {
      console.log('❌ Ошибка с SERVICE_ROLE ключом:', serviceError.message);
    } else {
      console.log('✅ С SERVICE_ROLE ключом видно книг:', serviceBooks?.length || 0);
    }
    
    console.log('\n📋 Шаг 3: Проверка RLS статуса таблицы books');
    const { data: rlsInfo, error: rlsError } = await serviceClient
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'books')
      .eq('schemaname', 'public');
    
    if (rlsError) {
      console.log('❌ Ошибка получения информации о таблице:', rlsError.message);
    } else {
      console.log('📊 Информация о таблице books:', rlsInfo);
    }
    
    console.log('\n📋 Шаг 4: Проверка политик RLS');
    const { data: policies, error: policiesError } = await serviceClient
      .rpc('sql', { 
        query: `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual, 
            with_check
          FROM pg_policies 
          WHERE tablename = 'books' AND schemaname = 'public';
        `
      });
    
    if (policiesError) {
      console.log('❌ Ошибка получения политик:', policiesError.message);
    } else {
      console.log('📊 RLS политики для таблицы books:', policies);
    }
    
    console.log('\n📋 Шаг 5: Попытка аутентификации как модератор');
    
    // Получаем модератора
    const { data: moderators, error: modError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError || !moderators || moderators.length === 0) {
      console.log('❌ Не удалось найти модератора');
      return;
    }
    
    const moderator = moderators[0];
    console.log('✅ Найден модератор:', moderator.email);
    
    // Попробуем установить пользователя в anon клиенте
    console.log('\n📋 Шаг 6: Симуляция аутентифицированного запроса');
    
    // Пробуем сделать запрос с установленным контекстом пользователя
    const { data: authBooks, error: authError } = await anonClient
      .rpc('set_current_user_id', { user_id: moderator.id })
      .then(() => anonClient
        .from('books')
        .select('id, title, status, author_id')
        .eq('status', 'Moderation')
      );
    
    if (authError) {
      console.log('❌ Ошибка с аутентифицированным запросом:', authError.message);
    } else {
      console.log('✅ С аутентификацией видно книг:', authBooks?.length || 0);
    }
    
    console.log('\n🎯 АНАЛИЗ:');
    console.log('📊 ANON ключ видит книг:', anonBooks?.length || 0);
    console.log('📊 SERVICE_ROLE ключ видит книг:', serviceBooks?.length || 0);
    
    if ((serviceBooks?.length || 0) > 0 && (anonBooks?.length || 0) === 0) {
      console.log('🔒 ПРОБЛЕМА: RLS политики блокируют доступ через ANON ключ');
      console.log('💡 РЕШЕНИЕ: Нужно настроить RLS политики для модераторов');
      console.log('🔧 Или нужно использовать аутентифицированные запросы в интерфейсе');
    } else if ((anonBooks?.length || 0) > 0) {
      console.log('✅ ANON ключ работает - проблема в другом месте');
    } else {
      console.log('❓ Нет книг в системе или другая проблема');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

testRLSPolicies(); 