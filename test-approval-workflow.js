const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create clients
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function testCompleteWorkflow() {
  console.log('🔄 Тестируем полный workflow одобрения книг...');
  
  try {
    // 1. Найдем автора
    console.log('\n📋 Шаг 1: Поиск автора');
    const { data: authors, error: authorsError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'author')
      .limit(1);
    
    if (authorsError || !authors || authors.length === 0) {
      console.error('❌ Автор не найден');
      return;
    }
    
    const author = authors[0];
    console.log(`✅ Найден автор: ${author.email}`);
    
    // 2. Найдем модератора
    console.log('\n📋 Шаг 2: Поиск модератора');
    const { data: moderators, error: modError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError || !moderators || moderators.length === 0) {
      console.error('❌ Модератор не найден');
      return;
    }
    
    const moderator = moderators[0];
    console.log(`✅ Найден модератор: ${moderator.email}`);
    
    // 3. Создаем тестовую книгу
    console.log('\n📋 Шаг 3: Создание тестовой книги');
    const testBook = {
      title: `Тест workflow ${Date.now()}`,
      description: 'Тестовая книга для проверки workflow одобрения',
      grade_level: '7',
      course: 'Тестирование',
      category: 'Учебник',
      language: 'Русский',
      pages_count: 100,
      price: 2500,
      base_url: `test-workflow-${Date.now()}`,
      author_id: author.id,
      status: 'Moderation' // Сразу отправляем на модерацию
    };
    
    const { data: createdBook, error: createError } = await serviceClient
      .from('books')
      .insert(testBook)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Ошибка создания книги:', createError.message);
      return;
    }
    
    console.log(`✅ Книга создана: "${createdBook.title}" (ID: ${createdBook.id})`);
    console.log(`📊 Статус: ${createdBook.status}`);
    
    // 4. Симулируем одобрение модератором
    console.log('\n📋 Шаг 4: Одобрение модератором');
    const { data: approvedBook, error: approveError } = await serviceClient
      .from('books')
      .update({ 
        status: 'Approved',
        moderator_id: moderator.id // Записываем ID модератора
      })
      .eq('id', createdBook.id)
      .select()
      .single();
    
    if (approveError) {
      console.error('❌ Ошибка одобрения:', approveError.message);
      return;
    }
    
    console.log(`✅ Книга одобрена модератором!`);
    console.log(`📊 Новый статус: ${approvedBook.status}`);
    console.log(`👨‍💼 Модератор ID: ${approvedBook.moderator_id}`);
    
    // 5. Проверяем что супер-админ видит одобренную книгу
    console.log('\n📋 Шаг 5: Проверка видимости для супер-админа');
    const { data: approvedBooks, error: checkError } = await serviceClient
      .from('books')
      .select('id, title, status, moderator_id')
      .eq('status', 'Approved');
    
    if (checkError) {
      console.error('❌ Ошибка проверки:', checkError.message);
      return;
    }
    
    console.log(`✅ Книг в статусе "Approved": ${approvedBooks.length}`);
    
    const ourBook = approvedBooks.find(b => b.id === createdBook.id);
    if (ourBook) {
      console.log(`✅ Наша книга найдена в списке одобренных!`);
      console.log(`📚 "${ourBook.title}" готова к публикации супер-админом`);
    } else {
      console.log(`❌ Наша книга НЕ найдена в списке одобренных`);
    }
    
    // 6. Найдем супер-админа и симулируем публикацию
    console.log('\n📋 Шаг 6: Публикация супер-админом');
    const { data: superAdmins, error: adminError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin')
      .limit(1);
    
    if (adminError || !superAdmins || superAdmins.length === 0) {
      console.error('❌ Супер-админ не найден');
      return;
    }
    
    const superAdmin = superAdmins[0];
    console.log(`✅ Найден супер-админ: ${superAdmin.email}`);
    
    // Активируем книгу
    const { data: publishedBook, error: publishError } = await serviceClient
      .from('books')
      .update({ status: 'Active' })
      .eq('id', createdBook.id)
      .select()
      .single();
    
    if (publishError) {
      console.error('❌ Ошибка публикации:', publishError.message);
      return;
    }
    
    console.log(`✅ Книга опубликована!`);
    console.log(`📊 Финальный статус: ${publishedBook.status}`);
    
    // 7. Итоговая проверка
    console.log('\n📋 Шаг 7: Итоговая проверка workflow');
    const { data: finalCheck, error: finalError } = await serviceClient
      .from('books')
      .select('id, title, status, author_id, moderator_id, created_at')
      .eq('id', createdBook.id)
      .single();
    
    if (finalError) {
      console.error('❌ Ошибка финальной проверки:', finalError.message);
      return;
    }
    
    console.log('\n🎉 WORKFLOW ТЕСТ ЗАВЕРШЕН!');
    console.log('📚 Результат:');
    console.log(`   - Название: "${finalCheck.title}"`);
    console.log(`   - Статус: ${finalCheck.status}`);
    console.log(`   - Автор ID: ${finalCheck.author_id}`);
    console.log(`   - Модератор ID: ${finalCheck.moderator_id}`);
    console.log(`   - Создана: ${new Date(finalCheck.created_at).toLocaleDateString('ru-RU')}`);
    
    // 8. Проверяем количество книг в каждом статусе
    console.log('\n📊 Текущая статистика книг:');
    const { data: allBooks } = await serviceClient
      .from('books')
      .select('status');
    
    const stats = {
      'Draft': allBooks.filter(b => b.status === 'Draft').length,
      'Moderation': allBooks.filter(b => b.status === 'Moderation').length,
      'Approved': allBooks.filter(b => b.status === 'Approved').length,
      'Active': allBooks.filter(b => b.status === 'Active').length,
    };
    
    Object.entries(stats).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} книг`);
    });
    
    if (stats.Approved > 0) {
      console.log('\n✅ ОТЛИЧНО! Теперь в системе есть одобренные книги!');
      console.log('👑 Супер-админ должен их видеть в интерфейсе для публикации');
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

// Запускаем тест
testCompleteWorkflow(); 