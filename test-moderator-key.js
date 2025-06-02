const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testModeratorRegistration() {
  const testKey = '3pnqso1xqxm57mijegi8b3'; // Первый доступный ключ модератора
  console.log('🔍 Тестируем ключ модератора:', testKey);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Проверяем ключ
    const { data: key, error: keyError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('key', testKey)
      .single();
    
    if (keyError) {
      console.log('❌ Ошибка получения ключа:', keyError.message);
      return;
    }
    
    console.log('📋 Информация о ключе:');
    console.log('   ID:', key.id);
    console.log('   Роль:', key.role);
    console.log('   Статус:', key.is_active ? 'Активен' : 'Неактивен');
    console.log('   Использований:', key.used_count + '/' + key.max_uses);
    console.log('   Срок действия:', key.expires_at || 'Без срока');
    console.log('   Создан:', new Date(key.created_at).toLocaleString('ru-RU'));
    
    // Проверяем логику валидации
    const now = new Date();
    const isExpired = key.expires_at && new Date(key.expires_at) < now;
    const isExhausted = key.used_count >= key.max_uses;
    
    console.log('\n🔍 Проверка валидности:');
    console.log('   Ключ активен:', key.is_active ? '✅' : '❌');
    console.log('   Не истек:', !isExpired ? '✅' : '❌');
    console.log('   Есть использования:', !isExhausted ? '✅' : '❌');
    
    if (key.is_active && !isExpired && !isExhausted) {
      console.log('\n✅ Ключ валиден и готов к использованию!');
      console.log('📝 URL для регистрации: http://localhost:3000/register?key=' + testKey);
    } else {
      console.log('\n❌ Ключ невалиден');
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

testModeratorRegistration(); 