const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create clients
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

const normalClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBookApprovalWorkflow() {
  console.log('🔄 Тестируем workflow одобрения книг...');
  
  try {
    // 1. Проверяем существующих пользователей
    console.log('\n📋 Шаг 1: Проверка пользователей');
    const { data: users, error: usersError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Ошибка получения пользователей:', usersError.message);
      return;
    }
    
    console.log(`✅ Найдено пользователей: ${users.length}`);
    
    const authors = users.filter(u => u.role === 'author');
    const moderators = users.filter(u => u.role === 'moderator');
    const superAdmins = users.filter(u => u.role === 'super_admin');
    
    console.log(`   - Авторы: ${authors.length}`);
    console.log(`   - Модераторы: ${moderators.length}`);
    console.log(`   - Супер-админы: ${superAdmins.length}`);
    
    authors.forEach(author => console.log(`     📝 Автор: ${author.email}`));
    moderators.forEach(mod => console.log(`     👨‍💼 Модератор: ${mod.email}`));
    superAdmins.forEach(admin => console.log(`     👑 Супер-админ: ${admin.email}`));
    
    // 2. Проверяем книги по статусам
    console.log('\n📋 Шаг 2: Анализ книг по статусам');
    const { data: books, error: booksError } = await serviceClient
      .from('books')
      .select('id, title, status, author_id, moderator_id, created_at')
      .order('created_at', { ascending: false });
    
    if (booksError) {
      console.error('❌ Ошибка получения книг:', booksError.message);
      return;
    }
    
    console.log(`✅ Всего книг: ${books.length}`);
    
    const statusCounts = {
      'Draft': books.filter(b => b.status === 'Draft').length,
      'Moderation': books.filter(b => b.status === 'Moderation').length,
      'Approved': books.filter(b => b.status === 'Approved').length,
      'Active': books.filter(b => b.status === 'Active').length,
    };
    
    console.log('📊 Статусы книг:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} книг`);
    });
    
    // 3. Детальный анализ одобренных книг
    const approvedBooks = books.filter(b => b.status === 'Approved');
    console.log('\n📋 Шаг 3: Анализ одобренных книг');
    console.log(`🔍 Книг в статусе "Approved": ${approvedBooks.length}`);
    
    if (approvedBooks.length > 0) {
      console.log('📚 Детали одобренных книг:');
      approvedBooks.forEach((book, index) => {
        console.log(`   ${index + 1}. "${book.title}"`);
        console.log(`      - ID: ${book.id}`);
        console.log(`      - Статус: ${book.status}`);
        console.log(`      - Автор ID: ${book.author_id}`);
        console.log(`      - Модератор ID: ${book.moderator_id || 'Не указан'}`);
        console.log(`      - Создана: ${new Date(book.created_at).toLocaleDateString('ru-RU')}`);
      });
      
      console.log('\n💡 Эти книги должны быть видны супер-админу для публикации!');
    } else {
      console.log('ℹ️ Нет книг в статусе "Approved" - нет одобренных модератором книг');
    }
    
    // 4. Проверяем что видит супер-админ
    console.log('\n📋 Шаг 4: Что видит супер-админ');
    if (superAdmins.length > 0) {
      // Симулируем запрос супер-админа через fetchBooksWithCorrectClient логику
      console.log('👑 Супер-админ должен видеть ВСЕ книги без фильтров');
      
      const superAdminBooks = books; // Супер-админ видит все
      console.log(`✅ Супер-админ видит: ${superAdminBooks.length} книг`);
      
      const readyForPublication = superAdminBooks.filter(b => b.status === 'Approved');
      console.log(`📋 Готовы к публикации: ${readyForPublication.length} книг`);
      
      if (readyForPublication.length > 0) {
        console.log('🎯 Эти книги супер-админ может опубликовать:');
        readyForPublication.forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}" (одобрена модератором)`);
        });
      }
    } else {
      console.log('⚠️ Нет супер-админов в системе');
    }
    
    // 5. Проверяем что видит модератор
    console.log('\n📋 Шаг 5: Что видит модератор');
    if (moderators.length > 0) {
      console.log('👨‍💼 Модератор видит только книги со статусом "Moderation"');
      
      const moderationBooks = books.filter(b => b.status === 'Moderation');
      console.log(`✅ Модератор видит: ${moderationBooks.length} книг на модерации`);
      
      if (moderationBooks.length > 0) {
        console.log('📋 Книги на модерации:');
        moderationBooks.forEach((book, index) => {
          console.log(`   ${index + 1}. "${book.title}"`);
        });
      }
    } else {
      console.log('⚠️ Нет модераторов в системе');
    }
    
    // 6. Заключение и рекомендации
    console.log('\n🎯 ЗАКЛЮЧЕНИЕ:');
    
    if (approvedBooks.length === 0) {
      console.log('❌ ПРОБЛЕМА: Нет книг в статусе "Approved"');
      console.log('💡 Это означает, что:');
      console.log('   1. Модераторы еще не одобрили ни одной книги, ИЛИ');
      console.log('   2. Одобренные книги не сохраняют статус "Approved", ИЛИ');
      console.log('   3. В handleApproveBook есть ошибка');
    } else {
      console.log('✅ Есть одобренные книги - workflow работает!');
      console.log(`📊 ${approvedBooks.length} книг ожидают публикации супер-админом`);
    }
    
    console.log('\n📋 Workflow должен работать так:');
    console.log('1. Автор создает книгу → статус "Draft"');
    console.log('2. Автор отправляет на модерацию → статус "Moderation"');
    console.log('3. Модератор одобряет → статус "Approved" + moderator_id');
    console.log('4. Супер-админ публикует → статус "Active"');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запускаем тест
testBookApprovalWorkflow(); 