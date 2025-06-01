const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createUpdateFunction() {
  console.log('🔧 Создание функции для обновления dashboard summary\n');
  
  try {
    // Попробуем создать простую функцию, которая будет возвращать правильную роль
    const { data, error } = await supabase.rpc('create_or_replace_function', {
      function_name: 'get_dashboard_summary_fixed',
      function_body: `
        CREATE OR REPLACE FUNCTION public.get_dashboard_summary_fixed(user_id UUID)
        RETURNS JSON AS $$
        DECLARE
            user_record RECORD;
            result JSON;
        BEGIN
            -- Получаем информацию о пользователе
            SELECT u.role, u.school_id, s.name as school_name
            INTO user_record
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.id = user_id;

            -- Если пользователь не найден
            IF user_record IS NULL THEN
                RETURN json_build_object('error', 'User not found');
            END IF;

            -- Возвращаем правильную роль
            result := json_build_object(
                'role', user_record.role,
                'school_id', user_record.school_id,
                'school_name', user_record.school_name
            );

            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (error) {
      console.error('❌ Ошибка создания функции:', error.message);
      
      // Попробуем другой подход - просто проверим текущую функцию
      console.log('\n🔍 Проверяю текущую функцию...');
      
      // Найдем автора для тестирования
      const { data: author, error: authorError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'test-author-fixed@example.com')
        .single();
        
      if (authorError) {
        console.error('❌ Ошибка поиска автора:', authorError.message);
        return;
      }
      
      console.log(`👤 Найден автор: ${author.email} (роль: ${author.role})`);
      
      // Тестируем текущую функцию
      const { data: currentResult, error: currentError } = await supabase.rpc('get_dashboard_summary', {
        user_id: author.id
      });
      
      if (currentError) {
        console.error('❌ Ошибка текущей функции:', currentError.message);
      } else {
        console.log('\n📊 Результат текущей функции:');
        console.log(`   Роль в ответе: ${currentResult?.role}`);
        console.log(`   Ожидаемая роль: ${author.role}`);
        console.log(`   Правильно ли: ${currentResult?.role === author.role ? '✅ ДА' : '❌ НЕТ'}`);
        
        if (currentResult?.role === author.role) {
          console.log('\n🎉 ОТЛИЧНО! Функция уже работает правильно!');
          console.log('✅ Автор теперь увидит "Панель Автора"');
          console.log('\n🎯 Данные для входа:');
          console.log(`   Email: ${author.email}`);
          console.log(`   Password: TestPassword123!`);
        } else {
          console.log('\n❌ Функция все еще работает неправильно');
          console.log('📋 Необходимо выполнить SQL скрипт вручную в Supabase Dashboard');
        }
      }
      
      return;
    }
    
    console.log('✅ Функция создана успешно');
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
    
    // В любом случае проверим, работает ли функция
    console.log('\n🔍 Финальная проверка функции...');
    
    try {
      const { data: author, error: authorError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'test-author-fixed@example.com')
        .single();
        
      if (!authorError && author) {
        const { data: testResult, error: testError } = await supabase.rpc('get_dashboard_summary', {
          user_id: author.id
        });
        
        if (!testError && testResult) {
          console.log(`📊 Роль в ответе функции: ${testResult?.role}`);
          console.log(`📊 Роль пользователя: ${author.role}`);
          
          if (testResult?.role === author.role) {
            console.log('🎉 ФУНКЦИЯ РАБОТАЕТ ПРАВИЛЬНО!');
          } else {
            console.log('❌ Функция все еще возвращает неправильную роль');
          }
        }
      }
    } catch (finalError) {
      console.error('❌ Ошибка финальной проверки:', finalError);
    }
  }
}

createUpdateFunction(); 