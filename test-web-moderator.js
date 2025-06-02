require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testWebModerator() {
  console.log('🌐 Тестируем веб-интерфейс модератора...');
  
  try {
    // Создаем админ клиент для создания пользователей
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    // Создаем обычный клиент для авторизации
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const testEmail = `test-web-moderator-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📋 Шаг 1: Создание тестового модератора');
    
    // Создаем аккаунт через админ клиент
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (createError) {
      console.log('❌ Ошибка создания пользователя:', createError.message);
      return;
    }
    
    // Создаем профиль модератора
    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        display_name: 'Test Web Moderator',
        role: 'moderator'
      });
    
    if (profileError) {
      console.log('❌ Ошибка создания профиля:', profileError.message);
      return;
    }
    
    console.log('✅ Модератор создан:', testEmail);
    
    console.log('📋 Шаг 2: Авторизация модератора');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.log('❌ Ошибка авторизации:', authError.message);
      return;
    }
    
    console.log('✅ Модератор авторизован');
    
    console.log('📋 Шаг 3: Получение профиля пользователя');
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    console.log('✅ Профиль получен:', userProfile?.role);
    
    console.log('📋 Шаг 4: Тестируем fetchBooksWithCorrectClient');
    
    // JavaScript версия функции (как в нашем utils файле)
    const createAdminClientLocal = () => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
      );
    };
    
    const shouldUseAdminClient = (role) => role === 'moderator';
    
    const fetchBooksWithCorrectClient = async (role, userId, fallbackClient) => {
      const useAdmin = shouldUseAdminClient(role);
      const client = useAdmin ? createAdminClientLocal() : fallbackClient;
      
      console.log(`🔑 Using ${useAdmin ? 'ADMIN' : 'REGULAR'} client for role: ${role}`);
      
      let query = client
        .from('books')
        .select('*');
      
      if (role === 'moderator') {
        query = query.eq('status', 'Moderation');
        console.log('👨‍💼 Moderator filter applied: status = Moderation');
      }
      
      return await query.order('created_at', { ascending: false });
    };
    
    const { data: booksData, error: booksError } = await fetchBooksWithCorrectClient(
      userProfile.role,
      userProfile.id,
      supabase
    );
    
    if (booksError) {
      console.log('❌ Ошибка получения книг:', booksError.message);
    } else {
      console.log('✅ Книги получены:', booksData?.length || 0);
      console.log('📊 Книги на модерации:');
      booksData?.forEach((book, index) => {
        console.log(`   ${index + 1}. ${book.title} (статус: ${book.status})`);
      });
    }
    
    console.log('📋 Шаг 5: Выход из системы');
    await supabase.auth.signOut();
    console.log('✅ Выход выполнен');
    
    console.log('📋 Шаг 6: Очистка - удаление тестового пользователя');
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Тестовый пользователь удален');
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

testWebModerator(); 