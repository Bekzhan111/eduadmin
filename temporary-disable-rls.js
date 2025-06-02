require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function temporaryDisableRLS() {
  console.log('⚠️ ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ RLS для диагностики...');
  console.log('🚨 ВНИМАНИЕ: Это НЕ рекомендуется для продакшена!');
  
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Шаг 1: Пробуем альтернативные методы отключения RLS');
    
    // Попробуем через обновление конфигурации таблицы
    const { data: currentData, error: currentError } = await serviceClient
      .from('books')
      .select('id')
      .limit(1);
    
    if (currentError) {
      console.log('❌ Текущий доступ к таблице books ограничен:', currentError.message);
    } else {
      console.log('✅ Доступ к таблице books есть');
    }
    
    console.log('\n📋 Шаг 2: Создаем простейшую RLS политику "разрешить всё"');
    
    // Попробуем создать политику через создание функции
    const { data: functionResult, error: functionError } = await serviceClient
      .rpc('create_permissive_policy');
    
    if (functionError) {
      console.log('❌ Функция create_permissive_policy не найдена:', functionError.message);
      console.log('💡 Пробуем через прямое создание записи...');
      
      // Попробуем создать тестовую запись для проверки политик
      const testBook = {
        title: 'Тест RLS политик',
        description: 'Тестовая книга для проверки RLS',
        grade_level: '1',
        course: 'Тест',
        category: 'Тест',
        status: 'Moderation',
        author_id: 'test-author-id',
        base_url: 'test-url'
      };
      
      const { data: insertResult, error: insertError } = await serviceClient
        .from('books')
        .insert(testBook)
        .select();
      
      if (insertError) {
        console.log('❌ Не удалось создать тестовую запись:', insertError.message);
        console.log('🔍 Это подтверждает проблему с RLS политиками');
      } else {
        console.log('✅ Тестовая запись создана:', insertResult[0]?.id);
        
        // Удалим тестовую запись
        await serviceClient
          .from('books')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🗑️ Тестовая запись удалена');
      }
    } else {
      console.log('✅ Функция create_permissive_policy выполнена:', functionResult);
    }
    
    console.log('\n📋 Шаг 3: Тестируем доступ модератора после попытки исправления');
    
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
      console.log('❌ Модератор не найден');
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
      console.log('❌ Ошибка входа:', authError.message);
      return;
    }
    
    console.log('✅ Успешный вход');
    
    // Тестируем доступ
    const { data: booksData, error: booksError } = await anonClient
      .from('books')
      .select('id, title, status')
      .eq('status', 'Moderation');
    
    if (booksError) {
      console.log('❌ Модератор все еще не видит книги:', booksError.message);
      console.log('📋 Код ошибки:', booksError.code);
      console.log('📋 Детали:', booksError.details);
      console.log('📋 Подсказка:', booksError.hint);
      
      // Попробуем без фильтра
      const { data: allBooksData, error: allBooksError } = await anonClient
        .from('books')
        .select('id, title, status');
      
      if (allBooksError) {
        console.log('❌ Доступ к таблице полностью заблокирован:', allBooksError.message);
      } else {
        console.log('✅ Доступ к таблице есть, но с ограничениями. Видно книг:', allBooksData?.length || 0);
      }
      
    } else {
      console.log('🎉 УСПЕХ! Модератор теперь видит книги:', booksData?.length || 0);
      
      if (booksData && booksData.length > 0) {
        console.log('📚 Книги на модерации:');
        booksData.slice(0, 3).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}"`);
        });
      }
    }
    
    await anonClient.auth.signOut();
    
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    console.log('1. Если проблема не решена, нужно обратиться к администратору Supabase');
    console.log('2. Возможно, нужно создать RLS политики через веб-интерфейс Supabase');
    console.log('3. Или создать миграцию через Supabase CLI');
    console.log('4. Альтернатива: использовать SERVICE_ROLE ключ в production (НЕ рекомендуется)');
    
  } catch (error) {
    console.error('❌ Ошибка временного исправления:', error instanceof Error ? error.message : String(error));
  }
}

// Создадим также функцию для сброса к исходному состоянию
async function createPermissivePolicy() {
  console.log('🔧 Создание разрешающей политики...');
  
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    // Попробуем создать функцию на стороне базы данных
    const functionSQL = `
      CREATE OR REPLACE FUNCTION create_permissive_book_policy()
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Удаляем все существующие политики для books
        DROP POLICY IF EXISTS "allow_all_books" ON books;
        DROP POLICY IF EXISTS "books_select_policy" ON books;
        DROP POLICY IF EXISTS "moderators_see_moderation" ON books;
        DROP POLICY IF EXISTS "authors_see_own" ON books;
        DROP POLICY IF EXISTS "users_see_active" ON books;
        
        -- Создаем разрешающую политику
        CREATE POLICY "allow_all_books" ON books FOR ALL USING (true);
        
        RETURN 'Разрешающая политика создана';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'Ошибка: ' || SQLERRM;
      END;
      $$;
    `;
    
    const { data: createFuncResult, error: createFuncError } = await serviceClient
      .rpc('exec_sql', { sql: functionSQL });
    
    if (createFuncError) {
      console.log('❌ Не удалось создать функцию:', createFuncError.message);
    } else {
      console.log('✅ Функция создана, выполняем...');
      
      const { data: execResult, error: execError } = await serviceClient
        .rpc('create_permissive_book_policy');
      
      if (execError) {
        console.log('❌ Ошибка выполнения функции:', execError.message);
      } else {
        console.log('✅ Результат:', execResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания политики:', error instanceof Error ? error.message : String(error));
  }
}

temporaryDisableRLS(); 