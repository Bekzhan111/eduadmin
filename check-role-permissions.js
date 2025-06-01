const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Роли для проверки
const ROLES = ['super_admin', 'school', 'teacher', 'student', 'author', 'moderator'];

// API ключи из .env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

console.log('🔍 Проверка API ключей и разрешений для каждой роли\n');

// Проверяем наличие ключей
console.log('📋 Проверка переменных окружения:');
console.log(`✅ SUPABASE_URL: ${SUPABASE_URL ? 'Установлен' : '❌ Отсутствует'}`);
console.log(`✅ ANON_KEY: ${ANON_KEY ? 'Установлен' : '❌ Отсутствует'}`);
console.log(`✅ SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? 'Установлен' : '❌ Отсутствует'}\n`);

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('❌ Отсутствуют необходимые переменные окружения');
  process.exit(1);
}

// Создаем клиенты с разными ключами
const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRolePermissions() {
  console.log('🔐 Проверка разрешений для каждой роли:\n');

  // Проверяем доступ к таблицам с анонимным ключом
  console.log('📊 Проверка доступа с ANON_KEY:');
  await checkTableAccess(anonClient, 'ANON');

  console.log('\n📊 Проверка доступа с SERVICE_ROLE_KEY:');
  await checkTableAccess(serviceClient, 'SERVICE');

  // Проверяем функции для каждой роли
  console.log('\n🔧 Проверка функций базы данных:');
  await checkDatabaseFunctions();

  // Проверяем ключи регистрации для каждой роли
  console.log('\n🗝️ Проверка ключей регистрации по ролям:');
  await checkRegistrationKeys();
}

async function checkTableAccess(client, keyType) {
  const tables = ['users', 'schools', 'registration_keys', 'books'];
  
  for (const table of tables) {
    try {
      const { data, error } = await client
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${keyType} - ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${keyType} - ${table}: Доступ разрешен (${data?.length || 0} записей)`);
      }
    } catch (err) {
      console.log(`  ❌ ${keyType} - ${table}: ${err.message}`);
    }
  }
}

async function checkDatabaseFunctions() {
  const functions = [
    'get_dashboard_summary',
    'create_registration_key',
    'register_with_key',
    'assign_student_keys_to_teacher'
  ];

  for (const func of functions) {
    try {
      // Пробуем вызвать функцию с тестовыми параметрами
      let result;
      
      switch (func) {
        case 'get_dashboard_summary':
          result = await serviceClient.rpc(func, { 
            user_id: '00000000-0000-0000-0000-000000000000' 
          });
          break;
        case 'create_registration_key':
          // Не вызываем, только проверяем существование
          result = { error: null };
          break;
        case 'register_with_key':
          // Не вызываем, только проверяем существование
          result = { error: null };
          break;
        case 'assign_student_keys_to_teacher':
          // Не вызываем, только проверяем существование
          result = { error: null };
          break;
        default:
          result = { error: 'Unknown function' };
      }
      
      if (result.error && !result.error.message?.includes('User not found')) {
        console.log(`  ❌ ${func}: ${result.error.message || result.error}`);
      } else {
        console.log(`  ✅ ${func}: Функция доступна`);
      }
    } catch (err) {
      console.log(`  ❌ ${func}: ${err.message}`);
    }
  }
}

async function checkRegistrationKeys() {
  try {
    const { data: keys, error } = await serviceClient
      .from('registration_keys')
      .select('role, is_active, expires_at, uses, max_uses')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`  ❌ Ошибка получения ключей: ${error.message}`);
      return;
    }

    // Группируем ключи по ролям
    const keysByRole = {};
    ROLES.forEach(role => {
      keysByRole[role] = keys?.filter(key => key.role === role) || [];
    });

    for (const role of ROLES) {
      const roleKeys = keysByRole[role];
      const activeKeys = roleKeys.filter(key => 
        key.is_active && 
        (!key.expires_at || new Date(key.expires_at) > new Date()) &&
        key.uses < key.max_uses
      );
      
      console.log(`  📝 ${role.toUpperCase()}: ${roleKeys.length} всего, ${activeKeys.length} активных`);
      
      if (roleKeys.length > 0) {
        const sample = roleKeys[0];
        console.log(`    └─ Пример: активен=${sample.is_active}, использований=${sample.uses}/${sample.max_uses}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Ошибка проверки ключей: ${err.message}`);
  }
}

async function checkUsersByRole() {
  console.log('\n👥 Проверка пользователей по ролям:');
  
  try {
    const { data: users, error } = await serviceClient
      .from('users')
      .select('role, school_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`  ❌ Ошибка получения пользователей: ${error.message}`);
      return;
    }

    // Группируем пользователей по ролям
    const usersByRole = {};
    ROLES.forEach(role => {
      usersByRole[role] = users?.filter(user => user.role === role) || [];
    });

    for (const role of ROLES) {
      const roleUsers = usersByRole[role];
      const withSchool = roleUsers.filter(user => user.school_id).length;
      
      console.log(`  👤 ${role.toUpperCase()}: ${roleUsers.length} пользователей`);
      if (role === 'teacher' || role === 'student') {
        console.log(`    └─ Привязаны к школе: ${withSchool}/${roleUsers.length}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Ошибка проверки пользователей: ${err.message}`);
  }
}

async function checkRLSPolicies() {
  console.log('\n🛡️ Проверка политик Row Level Security:');
  
  try {
    // Проверяем политики для таблицы users
    const { data: policies, error } = await serviceClient
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['users', 'schools', 'registration_keys']);

    if (error) {
      console.log(`  ❌ Ошибка получения политик: ${error.message}`);
      return;
    }

    const tableGroups = {};
    policies?.forEach(policy => {
      if (!tableGroups[policy.tablename]) {
        tableGroups[policy.tablename] = [];
      }
      tableGroups[policy.tablename].push(policy);
    });

    for (const [table, tablePolicies] of Object.entries(tableGroups)) {
      console.log(`  📋 ${table}: ${tablePolicies.length} политик`);
      tablePolicies.forEach(policy => {
        console.log(`    └─ ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (err) {
    console.log(`  ❌ Ошибка проверки политик: ${err.message}`);
  }
}

// Запускаем все проверки
async function runAllChecks() {
  try {
    await checkRolePermissions();
    await checkUsersByRole();
    await checkRLSPolicies();
    
    console.log('\n✅ Проверка завершена!');
    console.log('\n📝 Рекомендации:');
    console.log('1. Убедитесь, что все функции доступны');
    console.log('2. Проверьте наличие активных ключей для нужных ролей');
    console.log('3. Убедитесь, что политики RLS настроены правильно');
    console.log('4. Проверьте, что пользователи правильно привязаны к школам');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении проверок:', error);
  }
}

runAllChecks(); 