require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testAuthenticatedModerator() {
  console.log('🔐 Тестируем интерфейс модератора с аутентификацией...');
  
  try {
    // Создаем клиент с anon ключом (как в веб-приложении)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Сначала получаем модератора через service_role для получения данных
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
    );
    
    console.log('📋 Шаг 1: Получение данных модератора');
    const { data: moderators, error: modError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError || !moderators || moderators.length === 0) {
      console.log('❌ Модератор не найден');
      return;
    }
    
    const moderator = moderators[0];
    console.log('✅ Найден модератор:', moderator.email);
    
    // Теперь пытаемся войти как модератор
    console.log('\n📋 Шаг 2: Попытка входа как модератор');
    
    // Для этого нам нужен пароль. Давайте создадим тестового модератора или попробуем стандартный пароль
    const testPassword = 'TestPassword123'; // Стандартный пароль для тестов
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: moderator.email,
        password: testPassword
      });
      
      if (authError) {
        console.log('❌ Не удалось войти как модератор:', authError.message);
        console.log('💡 Попробуем создать тестового модератора с известным паролем...');
        
        // Создаем тестового модератора
        await createTestModerator(serviceClient, supabase);
        return;
      }
      
      console.log('✅ Успешный вход как модератор:', authData.user.email);
      
      // Теперь делаем запрос как аутентифицированный пользователь
      console.log('\n📋 Шаг 3: Запрос книг как аутентифицированный модератор');
      
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          title,
          status,
          author_id,
          created_at
        `)
        .eq('status', 'Moderation')
        .order('created_at', { ascending: false });
      
      if (booksError) {
        console.log('❌ Ошибка получения книг:', booksError.message);
      } else {
        console.log('✅ Получено книг:', booksData?.length || 0);
        
        if (booksData && booksData.length > 0) {
          console.log('\n📚 Список книг на модерации:');
          booksData.forEach((book, index) => {
            console.log(`   ${index + 1}. "${book.title}" (ID: ${book.id})`);
            console.log(`      Статус: ${book.status}`);
            console.log(`      Автор ID: ${book.author_id}`);
            console.log(`      Создана: ${new Date(book.created_at).toLocaleDateString('ru-RU')}`);
            console.log('');
          });
          
          console.log('🎉 УСПЕХ! Модератор видит книги на модерации!');
          console.log('💡 Веб-интерфейс должен работать корректно');
        } else {
          console.log('⚠️ Нет книг на модерации');
        }
      }
      
      // Выходим из системы
      await supabase.auth.signOut();
      console.log('✅ Выход из системы выполнен');
      
    } catch (loginError) {
      console.log('❌ Ошибка при входе:', loginError.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

async function createTestModerator(serviceClient, anonClient) {
  console.log('\n🔧 Создаем тестового модератора с известным паролем...');
  
  try {
    const testEmail = `test-moderator-auth-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    // Создаем пользователя в Auth
    const { data: authUser, error: signUpError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (signUpError) {
      console.log('❌ Ошибка создания пользователя в Auth:', signUpError.message);
      return;
    }
    
    console.log('✅ Пользователь создан в Auth:', testEmail);
    
    // Добавляем в таблицу users
    const { error: userError } = await serviceClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        role: 'moderator',
        display_name: 'Test Moderator'
      });
    
    if (userError) {
      console.log('❌ Ошибка добавления в таблицу users:', userError.message);
      return;
    }
    
    console.log('✅ Модератор добавлен в таблицу users');
    
    // Теперь пробуем войти как новый модератор
    console.log('\n📋 Вход как новый модератор...');
    
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.log('❌ Ошибка входа:', authError.message);
      return;
    }
    
    console.log('✅ Успешный вход как новый модератор');
    
    // Проверяем доступ к книгам
    const { data: booksData, error: booksError } = await anonClient
      .from('books')
      .select('id, title, status, author_id, created_at')
      .eq('status', 'Moderation')
      .order('created_at', { ascending: false });
    
    if (booksError) {
      console.log('❌ Ошибка получения книг новым модератором:', booksError.message);
    } else {
      console.log('✅ Новый модератор видит книг:', booksData?.length || 0);
      
      if (booksData && booksData.length > 0) {
        console.log('🎉 ПРОБЛЕМА РЕШЕНА! Аутентифицированный модератор видит книги!');
        console.log('💡 Проблема была в отсутствии аутентификации в предыдущих тестах');
        
        console.log('\n📚 Первые 3 книги:');
        booksData.slice(0, 3).forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}"`);
        });
      }
    }
    
    // Выходим
    await anonClient.auth.signOut();
    
  } catch (error) {
    console.log('❌ Ошибка создания тестового модератора:', error.message);
  }
}

testAuthenticatedModerator(); 