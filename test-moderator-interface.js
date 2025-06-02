require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testModeratorInterface() {
  console.log('🧪 Тестируем интерфейс модератора...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 1. Получаем модератора
    console.log('📋 Шаг 1: Получение модератора');
    const { data: moderators, error: modError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator')
      .limit(1);
    
    if (modError) {
      console.log('❌ Ошибка получения модераторов:', modError.message);
      return;
    }
    
    if (!moderators || moderators.length === 0) {
      console.log('❌ Модераторы не найдены');
      return;
    }
    
    const moderator = moderators[0];
    console.log(`✅ Найден модератор: ${moderator.email} (ID: ${moderator.id})`);
    
    // 2. Выполняем точно такой же запрос как в исправленном интерфейсе
    console.log('\n📋 Шаг 2: Выполнение запроса как в интерфейсе');
    console.log('🔍 Fetching books for role: moderator, User ID:', moderator.id);
    
    let query = supabase
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
        cover_image,
        file_size,
        pages_count,
        language,
        isbn,
        publisher,
        publication_date,
        downloads_count
      `);
    
    // Применяем фильтр модератора
    query = query.eq('status', 'Moderation');
    console.log('👨‍💼 Moderator filter applied: status = Moderation');
    
    console.log('🚀 Executing query...');
    const { data: booksData, error: booksError } = await query.order('created_at', { ascending: false });
    
    if (booksError) {
      console.error('❌ Database error:', booksError);
      console.error('📊 Error details:', JSON.stringify(booksError, null, 2));
      return;
    }
    
    console.log('✅ Books fetched successfully:', booksData?.length || 0, 'books');
    
    // 3. Получаем данные авторов отдельным запросом
    console.log('\n📋 Шаг 3: Получение данных авторов');
    let authorsData = [];
    if (booksData && booksData.length > 0) {
      const authorIds = [...new Set(booksData.map(book => book.author_id).filter(Boolean))];
      if (authorIds.length > 0) {
        console.log('👥 Fetching authors data for', authorIds.length, 'authors');
        const { data: authors, error: authorsError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', authorIds);
        
        if (!authorsError && authors) {
          authorsData = authors;
          console.log('✅ Authors data fetched:', authorsData.length, 'authors');
        } else {
          console.warn('⚠️ Could not fetch authors data:', authorsError?.message);
        }
      }
    }
    
    // 4. Обрабатываем данные как в интерфейсе
    console.log('\n📋 Шаг 4: Обработка данных');
    const formattedBooks = (booksData || []).map(book => {
      const authorData = authorsData.find(author => author.id === book.author_id);
      return {
        id: book.id,
        base_url: book.base_url,
        title: book.title,
        description: book.description,
        grade_level: book.grade_level,
        course: book.course,
        category: book.category,
        status: book.status,
        author_id: book.author_id,
        author_name: authorData?.display_name || authorData?.email || 'Unknown Author',
        created_at: book.created_at,
        updated_at: book.updated_at,
        price: book.price,
        cover_image: book.cover_image,
        schools_purchased: 0,
        schools_added: 0,
        teachers_added: 0,
        students_added: 0,
      };
    });
    
    console.log('📊 Formatted books:', formattedBooks.length);
    console.log('📊 Status breakdown:', {
      draft: formattedBooks.filter(b => b.status === 'Draft').length,
      moderation: formattedBooks.filter(b => b.status === 'Moderation').length,
      approved: formattedBooks.filter(b => b.status === 'Approved').length,
      active: formattedBooks.filter(b => b.status === 'Active').length,
    });
    
    // 5. Показываем детали каждой книги
    console.log('\n📋 Шаг 5: Детали книг на модерации');
    formattedBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
      console.log(`      - ID: ${book.id}`);
      console.log(`      - Статус: ${book.status}`);
      console.log(`      - Автор: ${book.author_name || book.author_id}`);
      console.log(`      - Цена: ${book.price ? '₸' + book.price : 'Бесплатно'}`);
      console.log(`      - Создана: ${new Date(book.created_at).toLocaleDateString('ru-RU')}`);
      console.log('');
    });
    
    // 6. Заключение
    console.log('🎯 ЗАКЛЮЧЕНИЕ:');
    if (formattedBooks.length > 0) {
      console.log('✅ Модератор успешно видит книги на модерации!');
      console.log(`📊 Всего книг: ${formattedBooks.length}`);
      console.log('💡 Книги должны отображаться в интерфейсе');
      console.log('🌐 Для проверки зайдите по адресу: http://localhost:3000');
      console.log('👤 Войдите как модератор: ' + moderator.email);
      console.log('📚 Перейдите в раздел Книги');
    } else {
      console.log('⚠️ Модератор не видит книг на модерации');
      console.log('🔍 Возможные причины:');
      console.log('   1. Нет книг со статусом "Moderation"');
      console.log('   2. Проблема с RLS политиками');
      console.log('   3. Ошибка в запросе');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

testModeratorInterface(); 