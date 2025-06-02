const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createNewModeratorKey() {
  try {
    const newKey = 'MOD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await supabase
      .from('registration_keys')
      .insert({
        key: newKey,
        role: 'moderator',
        is_active: true,
        max_uses: 1,
        uses: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней
        created_by: null
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Ошибка создания ключа:', error.message);
      return;
    }
    
    console.log('✅ Новый ключ модератора создан!');
    console.log('📋 Детали:');
    console.log('   Ключ:', data.key);
    console.log('   Роль:', data.role);
    console.log('   Срок действия:', new Date(data.expires_at).toLocaleDateString('ru-RU'));
    console.log('');
    console.log('🔗 URL для регистрации:');
    console.log('   http://localhost:3000/register?key=' + data.key);
    console.log('');
    console.log('📝 Инструкция для регистрации модератора:');
    console.log('   1. Откройте этот URL в браузере');
    console.log('   2. Заполните форму регистрации:');
    console.log('      - Email: ваш реальный email');
    console.log('      - Password: придумайте пароль');
    console.log('      - Полное имя: ваше имя');
    console.log('   3. Нажмите "Зарегистрироваться"');
    console.log('   4. После успешной регистрации войдите в систему');
    console.log('   5. Вы будете перенаправлены на "Moderator Dashboard"');
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  }
}

createNewModeratorKey(); 