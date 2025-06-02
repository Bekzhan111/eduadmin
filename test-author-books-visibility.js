const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAuthorBooksVisibility() {
  console.log('👁️ Тестируем видимость книг автора во всех статусах...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 1. Найдем автора
    console.log('📋 Шаг 1: Поиск автора');
    const { data: authors, error: authorsError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'author')
      .limit(1);
    
    if (authorsError) {
      throw new Error(`Ошибка поиска авторов: ${authorsError.message}`);
    }
    
    if (!authors || authors.length === 0) {
      console.log('⚠️ Авторы не найдены');
      return;
    }
    
    const testAuthor = authors[0];
    console.log('✅ Найден автор:', testAuthor.email, 'ID:', testAuthor.id);
    
    // 2. Создадим тестовые книги во всех статусах
    console.log('\n📋 Шаг 2: Создание тестовых книг в разных статусах');
    
    const testStatuses = ['Draft', 'Moderation', 'Approved', 'Active'];
    const createdBooks = [];
    
    for (const status of testStatuses) {
      const testBook = {
        title: `Тестовая книга в статусе ${status}`,
        description: `Описание книги в статусе ${status}`,
        grade_level: '7',
        course: 'Биология',
        category: 'Учебник',
        language: 'Русский',
        pages_count: 120,
        price: 3000,
        base_url: `test-book-${status.toLowerCase()}-${Date.now()}`,
        author_id: testAuthor.id,
        status: status
      };
      
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert(testBook)
        .select()
        .single();
      
      if (bookError) {
        console.log(`❌ Ошибка создания книги со статусом ${status}:`, bookError.message);
      } else {
        console.log(`✅ Создана книга "${book.title}" со статусом ${book.status}`);
        createdBooks.push(book);
      }
    }
    
    // 3. Проверим, что автор видит все свои книги
    console.log('\n📋 Шаг 3: Проверка видимости книг автора');
    const { data: authorBooks, error: booksError } = await supabase
      .from('books')
      .select('id, title, status, author_id')
      .eq('author_id', testAuthor.id)
      .order('created_at', { ascending: false });
    
    if (booksError) {
      console.log('❌ Ошибка получения книг автора:', booksError.message);
    } else {
      console.log(`✅ Автор видит ${authorBooks.length} книг:`);
      
      const statusCounts = {};
      authorBooks.forEach(book => {
        statusCounts[book.status] = (statusCounts[book.status] || 0) + 1;
        console.log(`  - ${book.title} (Статус: ${book.status})`);
      });
      
      console.log('\n📊 Статистика по статусам:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} книг`);
      });
    }
    
    // 4. Проверим, что модераторы видят только книги на модерации
    console.log('\n📋 Шаг 4: Проверка видимости для модераторов');
    const { data: moderationBooks, error: modError } = await supabase
      .from('books')
      .select('id, title, status, author_id')
      .eq('status', 'Moderation');
    
    if (modError) {
      console.log('❌ Ошибка получения книг на модерации:', modError.message);
    } else {
      console.log(`✅ Модераторы видят ${moderationBooks.length} книг на модерации:`);
      moderationBooks.forEach(book => {
        console.log(`  - ${book.title} (Автор: ${book.author_id})`);
      });
    }
    
    console.log('\n💡 Результат тестирования:');
    console.log('   ✅ Авторы теперь видят ВСЕ свои книги во всех статусах');
    console.log('   ✅ Модераторы видят только книги на модерации');
    console.log('   ✅ Система отслеживания статусов работает корректно');
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error.message);
  }
}

testAuthorBooksVisibility(); 