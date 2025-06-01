const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

console.log('🔧 Быстрое исправление проблем базы данных\n');

async function quickFix() {
  try {
    // 1. Получаем первую доступную школу
    console.log('📍 Поиск доступных школ...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1);

    if (schoolsError) {
      console.error('❌ Ошибка получения школ:', schoolsError.message);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('⚠️ Школы не найдены. Создаем тестовую школу...');
      
      const { data: newSchool, error: createError } = await supabase
        .from('schools')
        .insert([{
          name: 'Тестовая школа',
          address: 'Тестовый адрес',
          phone: '+7 (000) 000-00-00'
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Ошибка создания школы:', createError.message);
        return;
      }

      schools.push(newSchool);
      console.log('✅ Создана тестовая школа:', newSchool.name);
    }

    const defaultSchool = schools[0];
    console.log(`✅ Используем школу: ${defaultSchool.name} (${defaultSchool.id})`);

    // 2. Находим студентов без школы
    console.log('\n👥 Поиск студентов без школы...');
    const { data: studentsWithoutSchool, error: studentsError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'student')
      .is('school_id', null);

    if (studentsError) {
      console.error('❌ Ошибка получения студентов:', studentsError.message);
      return;
    }

    console.log(`📊 Найдено студентов без школы: ${studentsWithoutSchool?.length || 0}`);

    // 3. Привязываем студентов к школе
    if (studentsWithoutSchool && studentsWithoutSchool.length > 0) {
      console.log('🔗 Привязываем студентов к школе...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          school_id: defaultSchool.id,
          updated_at: new Date().toISOString()
        })
        .eq('role', 'student')
        .is('school_id', null);

      if (updateError) {
        console.error('❌ Ошибка обновления студентов:', updateError.message);
      } else {
        console.log(`✅ Привязано ${studentsWithoutSchool.length} студентов к школе`);
      }
    }

    // 4. Проверяем ключи для super_admin
    console.log('\n🗝️ Проверка ключей для super_admin...');
    const { data: adminKeys, error: keysError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (keysError) {
      console.error('❌ Ошибка получения ключей:', keysError.message);
    } else {
      console.log(`📊 Активных ключей super_admin: ${adminKeys?.length || 0}`);
      
      if (!adminKeys || adminKeys.length === 0) {
        console.log('➕ Создаем ключи для super_admin...');
        
        // Получаем первого super_admin для created_by
        const { data: superAdmin } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'super_admin')
          .limit(1)
          .single();

        const { error: createKeysError } = await supabase
          .from('registration_keys')
          .insert([
            {
              role: 'super_admin',
              max_uses: 5,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              created_by: superAdmin?.id,
              description: 'Автоматически созданные ключи для super_admin'
            }
          ]);

        if (createKeysError) {
          console.error('❌ Ошибка создания ключей:', createKeysError.message);
        } else {
          console.log('✅ Созданы ключи для super_admin');
        }
      }
    }

    // 5. Финальная проверка
    console.log('\n📊 Финальная проверка...');
    await finalCheck();

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

async function finalCheck() {
  try {
    // Проверяем пользователей по ролям
    const { data: userStats } = await supabase
      .from('users')
      .select('role, school_id')
      .order('role');

    const roleStats = {};
    userStats?.forEach(user => {
      if (!roleStats[user.role]) {
        roleStats[user.role] = { total: 0, withSchool: 0 };
      }
      roleStats[user.role].total++;
      if (user.school_id) {
        roleStats[user.role].withSchool++;
      }
    });

    console.log('\n👥 Статистика пользователей:');
    Object.entries(roleStats).forEach(([role, stats]) => {
      const schoolInfo = ['teacher', 'student'].includes(role) 
        ? ` (${stats.withSchool}/${stats.total} с школой)`
        : '';
      console.log(`  ${role}: ${stats.total}${schoolInfo}`);
    });

    // Проверяем ключи регистрации
    const { data: keyStats } = await supabase
      .from('registration_keys')
      .select('role, is_active, uses, max_uses');

    const keysByRole = {};
    keyStats?.forEach(key => {
      if (!keysByRole[key.role]) {
        keysByRole[key.role] = { total: 0, active: 0, available: 0 };
      }
      keysByRole[key.role].total++;
      if (key.is_active) {
        keysByRole[key.role].active++;
        if (key.uses < key.max_uses) {
          keysByRole[key.role].available++;
        }
      }
    });

    console.log('\n🗝️ Статистика ключей:');
    Object.entries(keysByRole).forEach(([role, stats]) => {
      console.log(`  ${role}: ${stats.total} всего, ${stats.active} активных, ${stats.available} доступных`);
    });

    console.log('\n✅ Проверка завершена!');
  } catch (error) {
    console.error('❌ Ошибка финальной проверки:', error);
  }
}

// Запускаем исправление
quickFix(); 