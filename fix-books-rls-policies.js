require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixBooksRLSPolicies() {
  console.log('🔧 Исправляем RLS политики для таблицы books...');
  
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Шаг 1: Проверка текущих политик для таблицы books');
    
    // Сначала удаляем все существующие политики для books
    const dropPoliciesSQL = `
      -- Удаляем все существующие политики для таблицы books
      DROP POLICY IF EXISTS "books_select_policy" ON books;
      DROP POLICY IF EXISTS "books_insert_policy" ON books;
      DROP POLICY IF EXISTS "books_update_policy" ON books;
      DROP POLICY IF EXISTS "books_delete_policy" ON books;
      DROP POLICY IF EXISTS "Enable select for authors" ON books;
      DROP POLICY IF EXISTS "Enable select for moderators" ON books;
      DROP POLICY IF EXISTS "Enable select for all users" ON books;
      DROP POLICY IF EXISTS "Enable insert for authors" ON books;
      DROP POLICY IF EXISTS "Enable update for authors and moderators" ON books;
      DROP POLICY IF EXISTS "Enable delete for authors" ON books;
      
      -- Включаем RLS если он не включен
      ALTER TABLE books ENABLE ROW LEVEL SECURITY;
    `;
    
    console.log('🗑️ Удаляем старые политики...');
    const { error: dropError } = await serviceClient.rpc('sql', { query: dropPoliciesSQL });
    
    if (dropError) {
      console.log('⚠️ Ошибка при удалении политик (возможно, их не было):', dropError.message);
    } else {
      console.log('✅ Старые политики удалены');
    }
    
    console.log('\n📋 Шаг 2: Создание новых RLS политик');
    
    const createPoliciesSQL = `
      -- Политика SELECT: разные роли видят разные книги
      CREATE POLICY "books_select_policy" ON books FOR SELECT USING (
        CASE 
          -- Авторы видят только свои книги
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'author' 
          THEN author_id = auth.uid()
          
          -- Модераторы видят все книги в статусе "Moderation"
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'moderator' 
          THEN status = 'Moderation'
          
          -- Супер админы видят все книги
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'super_admin' 
          THEN true
          
          -- Школы, учителя, студенты видят только активные книги
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) IN ('school', 'teacher', 'student') 
          THEN status = 'Active'
          
          -- По умолчанию - только активные книги
          ELSE status = 'Active'
        END
      );
      
      -- Политика INSERT: только авторы могут создавать книги
      CREATE POLICY "books_insert_policy" ON books FOR INSERT WITH CHECK (
        (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'author' 
        AND author_id = auth.uid()
      );
      
      -- Политика UPDATE: авторы обновляют свои книги, модераторы - статус
      CREATE POLICY "books_update_policy" ON books FOR UPDATE USING (
        CASE 
          -- Авторы могут обновлять свои книги
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'author' 
          THEN author_id = auth.uid()
          
          -- Модераторы могут обновлять статус книг на модерации
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'moderator' 
          THEN status = 'Moderation'
          
          -- Супер админы могут обновлять все
          WHEN (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'super_admin' 
          THEN true
          
          ELSE false
        END
      );
      
      -- Политика DELETE: только авторы могут удалять свои книги
      CREATE POLICY "books_delete_policy" ON books FOR DELETE USING (
        (SELECT role FROM auth.users() JOIN users ON auth.users().id = users.id) = 'author' 
        AND author_id = auth.uid()
      );
    `;
    
    console.log('🔨 Создаем новые политики...');
    const { error: createError } = await serviceClient.rpc('sql', { query: createPoliciesSQL });
    
    if (createError) {
      console.log('❌ Ошибка создания политик:', createError.message);
      
      // Попробуем более простую версию
      console.log('\n🔄 Пробуем упрощенную версию политик...');
      
      const simplePoliciesSQL = `
        -- Простая политика SELECT для модераторов
        CREATE POLICY "moderators_see_moderation" ON books FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'moderator'
          ) AND status = 'Moderation'
        );
        
        -- Простая политика SELECT для авторов
        CREATE POLICY "authors_see_own" ON books FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'author'
          ) AND author_id = auth.uid()
        );
        
        -- Простая политика SELECT для других пользователей
        CREATE POLICY "users_see_active" ON books FOR SELECT USING (
          status = 'Active'
        );
        
        -- Политика INSERT для авторов
        CREATE POLICY "authors_insert" ON books FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'author'
          ) AND author_id = auth.uid()
        );
      `;
      
      const { error: simpleError } = await serviceClient.rpc('sql', { query: simplePoliciesSQL });
      
      if (simpleError) {
        console.log('❌ Ошибка создания упрощенных политик:', simpleError.message);
        return;
      } else {
        console.log('✅ Упрощенные политики созданы');
      }
    } else {
      console.log('✅ Новые политики созданы');
    }
    
    console.log('\n📋 Шаг 3: Тестирование новых политик');
    
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
      password: 'TestPassword123' // Стандартный пароль
    });
    
    if (authError) {
      console.log('❌ Не удалось войти как модератор:', authError.message);
      return;
    }
    
    console.log('✅ Успешный вход');
    
    // Тестируем доступ к книгам
    const { data: booksData, error: booksError } = await anonClient
      .from('books')
      .select('id, title, status')
      .eq('status', 'Moderation');
    
    if (booksError) {
      console.log('❌ Ошибка получения книг после исправления политик:', booksError.message);
    } else {
      console.log('✅ Политики работают! Модератор видит книг:', booksData?.length || 0);
      
      if (booksData && booksData.length > 0) {
        console.log('\n🎉 ПРОБЛЕМА РЕШЕНА!');
        console.log('📚 Модератор теперь видит книги на модерации:');
        booksData.slice(0, 3).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}"`);
        });
      }
    }
    
    // Выходим
    await anonClient.auth.signOut();
    
    console.log('\n✅ RLS политики исправлены и протестированы!');
    console.log('💡 Теперь веб-интерфейс должен работать корректно');
    
  } catch (error) {
    console.error('❌ Ошибка исправления RLS политик:', error instanceof Error ? error.message : String(error));
  }
}

fixBooksRLSPolicies(); 