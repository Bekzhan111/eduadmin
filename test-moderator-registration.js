const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testModeratorRegistration() {
  const testKey = '3pnqso1xqxm57mijegi8b3'; // Первый доступный ключ модератора
  console.log('🔍 Тестируем полную регистрацию модератора с ключом:', testKey);
  
  // Используем service role key для полных прав
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
  );
  
  try {
    // 1. Проверяем ключ
    console.log('\n📋 Шаг 1: Проверка ключа');
    const { data: key, error: keyError } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('key', testKey)
      .single();
    
    if (keyError) {
      console.log('❌ Ошибка получения ключа:', keyError.message);
      return;
    }
    
    console.log('   Роль:', key.role);
    console.log('   Статус:', key.is_active ? 'Активен' : 'Неактивен');
    console.log('   Использований:', key.uses + '/' + key.max_uses);
    console.log('   Срок действия:', key.expires_at ? new Date(key.expires_at).toLocaleDateString('ru-RU') : 'Без срока');
    
    // Проверяем логику валидации (как в registration-helper.ts)
    const now = new Date();
    const isExpired = key.expires_at && new Date(key.expires_at) < now;
    const isExhausted = key.uses >= key.max_uses;
    
    console.log('\n🔍 Проверка валидности:');
    console.log('   Ключ активен:', key.is_active ? '✅' : '❌');
    console.log('   Не истек:', !isExpired ? '✅' : '❌');
    console.log('   Есть использования:', !isExhausted ? '✅' : '❌');
    
    if (!key.is_active || isExpired || isExhausted) {
      console.log('\n❌ Ключ невалиден');
      return;
    }
    
    console.log('\n✅ Ключ валиден!');
    
    // 2. Создаем тестового пользователя в Auth
    console.log('\n📋 Шаг 2: Создание тестового пользователя в Auth');
    const testEmail = `test-moderator-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (signUpError) {
      console.log('❌ Ошибка создания пользователя в Auth:', signUpError.message);
      return;
    }
    
    console.log('   User ID:', authUser.user.id);
    console.log('   Email:', authUser.user.email);
    
    // 3. Реализуем логику регистрации напрямую (как в registration-helper.ts)
    console.log('\n📋 Шаг 3: Регистрация пользователя');
    
    // Проверяем, существует ли пользователь в таблице users
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    console.log('   Проверка существующего пользователя:', { existingUser: !!existingUser, userCheckError: userCheckError?.message });

    let userOperation = 'insert';

    if (existingUser) {
      // Проверяем, полностью ли зарегистрирован пользователь
      if (existingUser.email && existingUser.display_name) {
        console.log('❌ Пользователь уже зарегистрирован');
        return;
      }
      
      // Пользователь существует, но неполный, обновляем
      userOperation = 'update';
      console.log('   Обновляем неполную запись пользователя...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: authUser.user.email,
          role: key.role,
          display_name: 'Тестовый Модератор',
          school_id: key.school_id,
          teacher_id: key.teacher_id
        })
        .eq('id', authUser.user.id);

      if (updateError) {
        console.log('❌ Ошибка обновления пользователя:', updateError.message);
        return;
      }
    } else {
      // Вставляем нового пользователя
      console.log('   Создаем новую запись пользователя...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: authUser.user.email,
          role: key.role,
          display_name: 'Тестовый Модератор',
          school_id: key.school_id,
          teacher_id: key.teacher_id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.log('❌ Ошибка создания пользователя:', insertError.message);
        return;
      }
    }

    // 4. Обновляем использование ключа
    console.log('\n📋 Шаг 4: Обновление использования ключа');
    const { error: updateKeyError } = await supabase
      .from('registration_keys')
      .update({ uses: key.uses + 1 })
      .eq('key', testKey);

    if (updateKeyError) {
      console.log('⚠️ Предупреждение: Ошибка обновления ключа:', updateKeyError.message);
    } else {
      console.log('   Ключ обновлен успешно');
    }

    // 5. Проверяем результат
    console.log('\n📋 Шаг 5: Проверка результата');
    
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    console.log('   Запись пользователя в БД:');
    console.log('     ID:', userRecord.id);
    console.log('     Email:', userRecord.email);
    console.log('     Роль:', userRecord.role);
    console.log('     Имя:', userRecord.display_name);
    
    const { data: updatedKey } = await supabase
      .from('registration_keys')
      .select('*')
      .eq('key', testKey)
      .single();
    
    console.log('   Обновленный ключ:');
    console.log('     Использований:', updatedKey.uses + '/' + updatedKey.max_uses);
    
    console.log('\n🎉 Тест завершен успешно!');
    console.log('\n📝 Данные для входа:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('   Role:', userRecord.role);
    console.log('\n📋 URL для входа: http://localhost:3000/login');
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

testModeratorRegistration(); 