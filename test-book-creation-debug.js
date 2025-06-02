require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugBookCreation() {
  console.log('🔍 Отладка процесса создания книги автором...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
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
      console.log('❌ Ошибка поиска авторов:', authorsError.message);
      return;
    }
    
    if (!authors || authors.length === 0) {
      console.log('❌ Авторы не найдены');
      return;
    }
    
    const testAuthor = authors[0];
    console.log(`✅ Найден автор: ${testAuthor.email} (ID: ${testAuthor.id})`);
    
    // 2. Создадим книгу как в форме
    console.log('\n📋 Шаг 2: Создание книги (симуляция формы)');
    const bookData = {
      title: `Тестовая книга от автора ${Date.now()}`,
      description: 'Описание тестовой книги созданной через симуляцию формы создания',
      grade_level: '6',
      course: 'Математика',
      category: 'Учебник',
      language: 'Русский',
      pages_count: 120,
      price: 2500,
      cover_image: null,
      base_url: `test-book-${Date.now()}`,
      author_id: testAuthor.id,
      status: 'Moderation' // Как в форме
    };
    
    console.log('📝 Данные книги:', JSON.stringify(bookData, null, 2));
    
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();
    
    if (bookError) {
      console.log('❌ Ошибка создания книги:', bookError.message);
      console.log('🔍 Детали ошибки:', JSON.stringify(bookError, null, 2));
      return;
    }
    
    console.log('✅ Книга создана успешно!');
    console.log('📖 Детали созданной книги:');
    console.log(`   - ID: ${book.id}`);
    console.log(`   - Название: ${book.title}`);
    console.log(`   - Статус: ${book.status}`);
    console.log(`   - Автор ID: ${book.author_id}`);
    console.log(`   - Создана: ${book.created_at}`);
    
    // 3. Проверим, видят ли модераторы эту книгу
    console.log('\n📋 Шаг 3: Проверка видимости модераторами');
    
    const { data: moderators, error: modError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator');
    
    if (modError) {
      console.log('❌ Ошибка получения модераторов:', modError.message);
      return;
    }
    
    console.log(`👥 Найдено модераторов: ${moderators.length}`);
    moderators.forEach((mod, index) => {
      console.log(`   ${index + 1}. ${mod.email} (ID: ${mod.id})`);
    });
    
    // 4. Проверим все книги на модерации
    console.log('\n📋 Шаг 4: Все книги на модерации');
    const { data: moderationBooks, error: modBooksError } = await supabase
      .from('books')
      .select('id, title, status, author_id, created_at')
      .eq('status', 'Moderation')
      .order('created_at', { ascending: false });
    
    if (modBooksError) {
      console.log('❌ Ошибка получения книг на модерации:', modBooksError.message);
      return;
    }
    
    console.log(`📚 Книг на модерации: ${moderationBooks.length}`);
    moderationBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
      console.log(`      - ID: ${book.id}`);
      console.log(`      - Статус: ${book.status}`);
      console.log(`      - Автор: ${book.author_id}`);
      console.log(`      - Создана: ${new Date(book.created_at).toLocaleDateString('ru-RU')}`);
    });
    
    // 5. Проверим запрос как в интерфейсе
    console.log('\n📋 Шаг 5: Запрос как в интерфейсе модератора');
    const { data: uiBooks, error: uiError } = await supabase
      .from('books')
      .select(`
        id,
        base_url,
        title,
        description,
        grade_level,
        course,
        category,
        status,
        author_id,
        moderator_id,
        created_at,
        updated_at,
        price,
        schools_purchased,
        schools_added,
        teachers_added,
        students_added
      `)
      .eq('status', 'Moderation')
      .order('created_at', { ascending: false });
    
    if (uiError) {
      console.log('❌ Ошибка UI запроса:', uiError.message);
      return;
    }
    
    console.log(`🖥️ Книг в UI запросе: ${uiBooks.length}`);
    uiBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}" (Статус: ${book.status})`);
    });
    
    // 6. Проверим структуру таблицы books
    console.log('\n📋 Шаг 6: Проверка структуры таблицы');
    const { data: tableInfo, error: tableError } = await supabase
      .from('books')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Ошибка доступа к таблице books:', tableError.message);
      console.log('💡 Возможно, таблица не существует или нет прав доступа');
    } else {
      console.log('✅ Таблица books доступна');
    }
    
    // 7. Заключение
    console.log('\n🎯 ЗАКЛЮЧЕНИЕ:');
    if (moderationBooks.length > 0) {
      console.log('✅ Система работает! Книги создаются и попадают на модерацию');
      console.log(`📊 Всего книг на модерации: ${moderationBooks.length}`);
      console.log('💡 Если модераторы не видят книги в интерфейсе:');
      console.log('   1. Проверьте фильтрацию по роли в коде');
      console.log('   2. Проверьте RLS политики для таблицы books');
      console.log('   3. Проверьте запросы в браузере DevTools');
    } else {
      console.log('❌ Проблема: книги не попадают в статус Moderation');
      console.log('🔍 Нужно проверить:');
      console.log('   1. Права доступа к таблице books');
      console.log('   2. RLS политики');
      console.log('   3. Фильтры в запросах');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

debugBookCreation(); 