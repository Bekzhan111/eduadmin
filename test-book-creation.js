const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testBookCreation() {
  console.log('🧪 Тестируем создание книги и отправку на модерацию...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 1. Проверяем наличие тестового автора
    console.log('📋 Шаг 1: Поиск тестового автора');
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
    
    // 2. Попробуем создать тестовую книгу
    console.log('📋 Шаг 2: Создание тестовой книги');
    const testBook = {
      title: 'Тестовая книга математики',
      description: 'Описание тестовой книги',
      grade_level: '5',
      course: 'Математика',
      category: 'Учебник',
      language: 'Русский',
      pages_count: 150,
      price: 2500, // Целое число
      base_url: 'test-math-book-' + Date.now(),
      author_id: testAuthor.id,
      status: 'Moderation'
    };
    
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert(testBook)
      .select()
      .single();
    
    if (bookError) {
      console.log('❌ Ошибка создания книги:', bookError.message);
      console.log('📊 Детали ошибки:', JSON.stringify(bookError, null, 2));
      return;
    }
    
    console.log('✅ Книга создана успешно:', book.title);
    console.log('📊 ID книги:', book.id);
    console.log('📊 Статус:', book.status);
    console.log('📊 Цена:', book.price, 'тип:', typeof book.price);
    
    // 3. Проверяем модераторов
    console.log('\n📋 Шаг 3: Проверка модераторов');
    const { data: moderators, error: modError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator');
    
    if (modError) {
      console.log('❌ Ошибка поиска модераторов:', modError.message);
    } else {
      console.log('✅ Найдено модераторов:', moderators.length);
      moderators.forEach(mod => {
        console.log('  - Модератор:', mod.email, 'ID:', mod.id);
      });
    }
    
    // 4. Проверяем видимость книги для модераторов
    console.log('\n📋 Шаг 4: Проверка книг на модерацию');
    const { data: moderationBooks, error: modBooksError } = await supabase
      .from('books')
      .select('id, title, status, author_id, price')
      .eq('status', 'Moderation');
    
    if (modBooksError) {
      console.log('❌ Ошибка получения книг на модерацию:', modBooksError.message);
    } else {
      console.log('✅ Книг на модерации:', moderationBooks.length);
      moderationBooks.forEach(book => {
        console.log(`  - ${book.title} (ID: ${book.id}, Цена: ${book.price}, Автор: ${book.author_id})`);
      });
    }
    
    // 5. Тест с проблематичной ценой
    console.log('\n📋 Шаг 5: Тестирование проблематичной цены (4999.89)');
    const problematicBook = {
      title: 'Книга с проблематичной ценой',
      description: 'Тест ошибки с ценой',
      grade_level: '6',
      course: 'Физика',
      category: 'Учебник',
      language: 'Русский',
      pages_count: 200,
      price: 4999.89, // Проблематичная цена
      base_url: 'problematic-price-book-' + Date.now(),
      author_id: testAuthor.id,
      status: 'Draft'
    };
    
    const { data: badBook, error: badBookError } = await supabase
      .from('books')
      .insert(problematicBook)
      .select()
      .single();
    
    if (badBookError) {
      console.log('❌ Ожидаемая ошибка с ценой:', badBookError.message);
      if (badBookError.message.includes('invalid input syntax for type integer')) {
        console.log('✅ Подтверждена проблема с типом данных price');
      }
    } else {
      console.log('⚠️ Неожиданно: книга с дробной ценой создана:', badBook.price);
    }
    
    console.log('\n🎉 Тест завершен!');
    
  } catch (error) {
    console.error('💥 Ошибка теста:', error.message);
  }
}

testBookCreation(); 