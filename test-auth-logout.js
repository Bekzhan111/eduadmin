const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAuthLogout() {
  console.log('🔍 Тестируем процесс выхода из системы...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 1. Проверяем текущую сессию
    console.log('\n📋 Шаг 1: Проверка текущей сессии');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Ошибка получения сессии:', sessionError.message);
      return;
    }
    
    if (!sessionData.session) {
      console.log('ℹ️ Нет активной сессии');
      return;
    }
    
    console.log('✅ Активная сессия найдена для пользователя:', sessionData.session.user.email);
    
    // 2. Проверяем возможность получения профиля пользователя
    console.log('\n📋 Шаг 2: Попытка получения профиля пользователя');
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, display_name')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();
      
      if (userError) {
        console.log('❌ Ошибка получения профиля:', userError.message);
        
        // Проверяем, является ли это сетевой ошибкой
        if (userError.message.includes('Load failed')) {
          console.log('🌐 Обнаружена сетевая ошибка "Load failed"');
          console.log('💡 Это обычная ошибка при проблемах с сетью или во время выхода');
        }
      } else if (userData) {
        console.log('✅ Профиль получен:', {
          role: userData.role,
          email: userData.email,
          display_name: userData.display_name
        });
      } else {
        console.log('⚠️ Пользователь не найден в таблице users');
      }
    } catch (networkError) {
      console.log('❌ Сетевая ошибка при получении профиля:', networkError.message);
      console.log('💡 Это нормально, если происходит во время выхода из системы');
    }
    
    // 3. Тестируем выход из системы
    console.log('\n📋 Шаг 3: Тестирование выхода из системы');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.log('❌ Ошибка выхода:', signOutError.message);
      } else {
        console.log('✅ Выход выполнен успешно');
      }
    } catch (signOutNetworkError) {
      console.log('⚠️ Сетевая ошибка при выходе:', signOutNetworkError.message);
      console.log('💡 Локальное состояние все равно должно быть очищено');
    }
    
    // 4. Проверяем состояние после выхода
    console.log('\n📋 Шаг 4: Проверка состояния после выхода');
    const { data: postLogoutSession } = await supabase.auth.getSession();
    
    if (postLogoutSession.session) {
      console.log('⚠️ Сессия все еще активна после выхода');
    } else {
      console.log('✅ Сессия успешно завершена');
    }
    
    console.log('\n🎉 Тест завершен!');
    console.log('\n📝 Рекомендации:');
    console.log('   - Ошибки "Load failed" при выходе - это нормально');
    console.log('   - Важно очищать локальное состояние независимо от сетевых ошибок');
    console.log('   - Перенаправление на /login должно происходить всегда');
    
  } catch (error) {
    console.error('💥 Ошибка теста:', error.message);
  }
}

testAuthLogout(); 