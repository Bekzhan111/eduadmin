const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

const ALL_ROLES = ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'];

console.log('🔍 Проверка всех ключей регистрации\n');

async function checkAllKeys() {
  try {
    // Получаем все ключи
    const { data: keys, error } = await supabase
      .from('registration_keys')
      .select('*')
      .order('role, created_at');

    if (error) {
      console.error('❌ Ошибка получения ключей:', error.message);
      return;
    }

    console.log(`📊 Всего ключей в системе: ${keys?.length || 0}\n`);

    // Группируем по ролям
    const keysByRole = {};
    ALL_ROLES.forEach(role => {
      keysByRole[role] = keys?.filter(key => key.role === role) || [];
    });

    // Анализируем каждую роль
    console.log('📋 Детальный анализ по ролям:\n');
    
    for (const role of ALL_ROLES) {
      const roleKeys = keysByRole[role];
      console.log(`🔑 ${role.toUpperCase()}:`);
      
      if (roleKeys.length === 0) {
        console.log('  ❌ Ключи отсутствуют');
        continue;
      }

      const activeKeys = roleKeys.filter(key => key.is_active);
      const availableKeys = roleKeys.filter(key => 
        key.is_active && 
        key.uses < key.max_uses &&
        (!key.expires_at || new Date(key.expires_at) > new Date())
      );
      const expiredKeys = roleKeys.filter(key => 
        key.expires_at && new Date(key.expires_at) <= new Date()
      );
      const exhaustedKeys = roleKeys.filter(key => key.uses >= key.max_uses);

      console.log(`  📊 Всего: ${roleKeys.length}`);
      console.log(`  ✅ Активных: ${activeKeys.length}`);
      console.log(`  🟢 Доступных: ${availableKeys.length}`);
      console.log(`  ⏰ Истекших: ${expiredKeys.length}`);
      console.log(`  🔴 Исчерпанных: ${exhaustedKeys.length}`);

      // Показываем примеры доступных ключей
      if (availableKeys.length > 0) {
        console.log('  📝 Примеры доступных ключей:');
        availableKeys.slice(0, 3).forEach((key, index) => {
          const expiresDate = key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Без срока';
          console.log(`    ${index + 1}. ${key.key} (${key.uses}/${key.max_uses} использований, до ${expiresDate})`);
        });
        if (availableKeys.length > 3) {
          console.log(`    ... и еще ${availableKeys.length - 3} ключей`);
        }
      }
      console.log('');
    }

    // Создаем сводную таблицу
    console.log('📊 Сводная таблица:');
    console.log('┌─────────────┬───────┬─────────┬───────────┬─────────┬────────────┐');
    console.log('│ Роль        │ Всего │ Активных│ Доступных │ Истекших│ Исчерпанных│');
    console.log('├─────────────┼───────┼─────────┼───────────┼─────────┼────────────┤');
    
    for (const role of ALL_ROLES) {
      const roleKeys = keysByRole[role];
      const activeKeys = roleKeys.filter(key => key.is_active);
      const availableKeys = roleKeys.filter(key => 
        key.is_active && 
        key.uses < key.max_uses &&
        (!key.expires_at || new Date(key.expires_at) > new Date())
      );
      const expiredKeys = roleKeys.filter(key => 
        key.expires_at && new Date(key.expires_at) <= new Date()
      );
      const exhaustedKeys = roleKeys.filter(key => key.uses >= key.max_uses);

      const roleName = role.padEnd(11);
      const total = roleKeys.length.toString().padStart(5);
      const active = activeKeys.length.toString().padStart(7);
      const available = availableKeys.length.toString().padStart(9);
      const expired = expiredKeys.length.toString().padStart(7);
      const exhausted = exhaustedKeys.length.toString().padStart(10);

      console.log(`│ ${roleName} │ ${total} │ ${active} │ ${available} │ ${expired} │ ${exhausted} │`);
    }
    console.log('└─────────────┴───────┴─────────┴───────────┴─────────┴────────────┘');

    // Проверяем проблемы
    console.log('\n🚨 Анализ проблем:');
    const problems = [];
    
    for (const role of ALL_ROLES) {
      const roleKeys = keysByRole[role];
      const availableKeys = roleKeys.filter(key => 
        key.is_active && 
        key.uses < key.max_uses &&
        (!key.expires_at || new Date(key.expires_at) > new Date())
      );
      
      if (availableKeys.length === 0) {
        problems.push(`❌ ${role}: Нет доступных ключей`);
      } else if (availableKeys.length < 3) {
        problems.push(`⚠️ ${role}: Мало ключей (${availableKeys.length})`);
      }
    }

    if (problems.length === 0) {
      console.log('✅ Проблем не обнаружено! Все роли имеют достаточно ключей.');
    } else {
      problems.forEach(problem => console.log(`  ${problem}`));
    }

    // Рекомендации
    console.log('\n💡 Рекомендации:');
    console.log('1. Для регистрации используйте: http://localhost:3000/register?key=КЛЮЧ');
    console.log('2. Ключи super_admin создавайте через SQL (fix-super-admin-keys.sql)');
    console.log('3. Регулярно проверяйте срок действия ключей');
    console.log('4. Создавайте новые ключи заранее, до истечения старых');

  } catch (error) {
    console.error('❌ Ошибка при проверке ключей:', error);
  }
}

// Запускаем проверку
checkAllKeys(); 