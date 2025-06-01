const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

// Все роли в системе
const ALL_ROLES = ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'];

// Конфигурация ключей для каждой роли
const ROLE_KEY_CONFIG = {
  super_admin: { count: 5, maxUses: 3, daysValid: 90 },
  school: { count: 10, maxUses: 5, daysValid: 60 },
  teacher: { count: 50, maxUses: 1, daysValid: 30 },
  student: { count: 200, maxUses: 1, daysValid: 30 },
  author: { count: 20, maxUses: 1, daysValid: 60 },
  moderator: { count: 10, maxUses: 1, daysValid: 90 }
};

console.log('🗝️ Создание ключей регистрации для всех ролей\n');

async function createKeysForAllRoles() {
  try {
    // 1. Проверяем текущее состояние ключей
    console.log('📊 Проверка текущих ключей...');
    await checkCurrentKeys();

    // 2. Получаем администратора для created_by
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .in('role', ['super_admin', 'school'])
      .limit(1)
      .single();

    if (!admin) {
      console.error('❌ Не найден администратор для создания ключей');
      return;
    }

    console.log(`✅ Используем администратора: ${admin.id}`);

    // 3. Создаем ключи для каждой роли
    for (const role of ALL_ROLES) {
      await createKeysForRole(role, admin.id);
    }

    // 4. Финальная проверка
    console.log('\n📊 Финальная проверка созданных ключей...');
    await checkCurrentKeys();

    console.log('\n✅ Создание ключей завершено!');

  } catch (error) {
    console.error('❌ Ошибка при создании ключей:', error);
  }
}

async function checkCurrentKeys() {
  try {
    const { data: keys, error } = await supabase
      .from('registration_keys')
      .select('role, is_active, uses, max_uses, expires_at')
      .order('role');

    if (error) {
      console.error('❌ Ошибка получения ключей:', error.message);
      return;
    }

    // Группируем по ролям
    const keysByRole = {};
    ALL_ROLES.forEach(role => {
      keysByRole[role] = keys?.filter(key => key.role === role) || [];
    });

    console.log('\n📋 Текущее состояние ключей:');
    for (const role of ALL_ROLES) {
      const roleKeys = keysByRole[role];
      const activeKeys = roleKeys.filter(key => 
        key.is_active && 
        (!key.expires_at || new Date(key.expires_at) > new Date()) &&
        key.uses < key.max_uses
      );
      
      const status = activeKeys.length > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${role.toUpperCase()}: ${roleKeys.length} всего, ${activeKeys.length} доступных`);
    }
  } catch (err) {
    console.error('❌ Ошибка проверки ключей:', err.message);
  }
}

async function createKeysForRole(role, createdBy) {
  try {
    console.log(`\n🔑 Создание ключей для роли: ${role.toUpperCase()}`);
    
    const config = ROLE_KEY_CONFIG[role];
    if (!config) {
      console.log(`  ⚠️ Конфигурация для роли ${role} не найдена`);
      return;
    }

    // Проверяем существующие активные ключи
    const { data: existingKeys } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('role', role)
      .eq('is_active', true);

    const activeKeys = existingKeys?.filter(key => 
      (!key.expires_at || new Date(key.expires_at) > new Date()) &&
      key.uses < key.max_uses
    ) || [];

    console.log(`  📊 Активных ключей: ${activeKeys.length}`);

    if (activeKeys.length >= config.count) {
      console.log(`  ✅ Достаточно ключей для роли ${role} (${activeKeys.length}/${config.count})`);
      return;
    }

    // Создаем недостающие ключи
    const keysToCreate = config.count - activeKeys.length;
    console.log(`  ➕ Создаем ${keysToCreate} ключей...`);

    const newKeys = [];
    for (let i = 0; i < keysToCreate; i++) {
      newKeys.push({
        key: generateRandomKey(),
        role: role,
        max_uses: config.maxUses,
        expires_at: new Date(Date.now() + config.daysValid * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: createdBy,
        uses: 0
      });
    }

    const { data, error } = await supabase
      .from('registration_keys')
      .insert(newKeys)
      .select();

    if (error) {
      console.error(`  ❌ Ошибка создания ключей для ${role}:`, error.message);
    } else {
      console.log(`  ✅ Создано ${data?.length || 0} ключей для ${role}`);
      
      // Показываем примеры созданных ключей
      if (data && data.length > 0) {
        console.log(`  📝 Примеры ключей:`);
        data.slice(0, 3).forEach((key, index) => {
          console.log(`    ${index + 1}. ${key.key} (до ${new Date(key.expires_at).toLocaleDateString()})`);
        });
        if (data.length > 3) {
          console.log(`    ... и еще ${data.length - 3} ключей`);
        }
      }
    }

  } catch (err) {
    console.error(`❌ Ошибка создания ключей для ${role}:`, err.message);
  }
}

function generateRandomKey() {
  // Генерируем читаемый ключ в формате: ROLE-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function showKeysSummary() {
  console.log('\n📋 Итоговая сводка по ключам:');
  
  try {
    const { data: keys } = await supabase
      .from('registration_keys')
      .select('role, is_active, uses, max_uses, expires_at, key')
      .order('role');

    const summary = {};
    ALL_ROLES.forEach(role => {
      const roleKeys = keys?.filter(key => key.role === role) || [];
      const activeKeys = roleKeys.filter(key => 
        key.is_active && 
        (!key.expires_at || new Date(key.expires_at) > new Date()) &&
        key.uses < key.max_uses
      );
      
      summary[role] = {
        total: roleKeys.length,
        active: activeKeys.length,
        config: ROLE_KEY_CONFIG[role]
      };
    });

    console.log('\n| Роль | Всего | Активных | Цель | Статус |');
    console.log('|------|-------|----------|------|---------|');
    
    for (const role of ALL_ROLES) {
      const s = summary[role];
      const status = s.active >= s.config.count ? '✅ Готово' : `⚠️ Нужно ${s.config.count - s.active}`;
      console.log(`| ${role} | ${s.total} | ${s.active} | ${s.config.count} | ${status} |`);
    }

  } catch (err) {
    console.error('❌ Ошибка создания сводки:', err.message);
  }
}

// Запускаем создание ключей
async function main() {
  await createKeysForAllRoles();
  await showKeysSummary();
  
  console.log('\n🎯 Рекомендации по использованию:');
  console.log('1. Ключи super_admin - для создания новых администраторов');
  console.log('2. Ключи school - для регистрации школ');
  console.log('3. Ключи teacher - для учителей (привязываются к школе)');
  console.log('4. Ключи student - для студентов (привязываются к школе)');
  console.log('5. Ключи author - для авторов контента');
  console.log('6. Ключи moderator - для модераторов системы');
  
  console.log('\n📱 Для регистрации используйте: http://localhost:3000/register?key=КЛЮЧ');
}

main(); 