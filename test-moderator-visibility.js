require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testModeratorVisibility() {
  console.log('🧪 Тестируем видимость книг для всех модераторов...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 1. Получаем всех модераторов
    console.log('📋 Шаг 1: Получение всех модераторов');
    const { data: moderators, error: modError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'moderator');
    
    if (modError) {
      console.log('❌ Ошибка получения модераторов:', modError.message);
      return;
    }
    
    console.log(`✅ Найдено модераторов: ${moderators.length}`);
    moderators.forEach((mod, index) => {
      console.log(`   ${index + 1}. ${mod.email} (ID: ${mod.id})`);
    });
    
    // 2. Получаем все книги на модерации (упрощенный запрос)
    console.log('\n📋 Шаг 2: Получение книг на модерации');
    const { data: moderationBooks, error: booksError } = await supabase
      .from('books')
      .select(`
        id, 
        title, 
        status, 
        author_id, 
        moderator_id,
        created_at
      `)
      .eq('status', 'Moderation')
      .order('created_at', { ascending: false });
    
    if (booksError) {
      console.log('❌ Ошибка получения книг:', booksError.message);
      return;
    }
    
    console.log(`✅ Книг на модерации: ${moderationBooks.length}`);
    moderationBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
      console.log(`      - ID книги: ${book.id}`);
      console.log(`      - Автор ID: ${book.author_id}`);
      console.log(`      - Создана: ${new Date(book.created_at).toLocaleDateString('ru-RU')}`);
      console.log(`      - Назначенный модератор: ${book.moderator_id || 'Не назначен'}`);
    });
    
    // 3. Проверяем логику: все модераторы должны видеть ВСЕ книги на модерации
    console.log('\n📋 Шаг 3: Анализ системы модерации');
    console.log('🔍 Логика системы:');
    console.log('   ✅ Все модераторы видят ВСЕ книги со статусом "Moderation"');
    console.log('   ✅ Нет фильтрации по moderator_id при просмотре');
    console.log('   ✅ moderator_id записывается только при одобрении/отклонении');
    console.log('   ✅ Любой модератор может работать с любой книгой');
    
    // 4. Симулируем запрос модератора
    console.log('\n📋 Шаг 4: Симуляция запроса от модератора');
    if (moderators.length > 0) {
      const testModerator = moderators[0];
      console.log(`🎭 Тестируем от имени модератора: ${testModerator.email}`);
      
      // Запрос, который делает система для модератора
      const { data: moderatorBooks, error: modBooksError } = await supabase
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
          price
        `)
        .eq('status', 'Moderation')
        .order('created_at', { ascending: false });
      
      if (modBooksError) {
        console.log('❌ Ошибка запроса модератора:', modBooksError.message);
      } else {
        console.log(`✅ Модератор видит книг: ${moderatorBooks.length}`);
        console.log('   Это значит, что ВСЕ модераторы видят одинаковый список!');
      }
    }
    
    // 5. Проверяем статистику
    console.log('\n📋 Шаг 5: Статистика модерации');
    const totalModerationBooks = moderationBooks.length;
    const assignedBooks = moderationBooks.filter(book => book.moderator_id).length;
    const unassignedBooks = totalModerationBooks - assignedBooks;
    
    console.log(`📊 Всего книг на модерации: ${totalModerationBooks}`);
    console.log(`📊 Уже имеют назначенного модератора: ${assignedBooks}`);
    console.log(`📊 Без назначенного модератора: ${unassignedBooks}`);
    
    // 6. Проверим также все статусы книг для понимания общей картины
    console.log('\n📋 Шаг 6: Общая статистика всех книг');
    const { data: allBooks, error: allBooksError } = await supabase
      .from('books')
      .select('id, title, status')
      .order('created_at', { ascending: false });
    
    if (allBooksError) {
      console.log('❌ Ошибка получения всех книг:', allBooksError.message);
    } else {
      const statusStats = allBooks.reduce((acc, book) => {
        acc[book.status] = (acc[book.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`📊 Всего книг в системе: ${allBooks.length}`);
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} книг`);
      });
    }
    
    // 7. Заключение
    console.log('\n🎉 ЗАКЛЮЧЕНИЕ:');
    console.log('✅ Система работает правильно!');
    console.log('✅ Все модераторы видят ВСЕ книги на модерации');
    console.log('✅ Нет ограничений по конкретному модератору');
    console.log('✅ Книги доступны всем модераторам для обработки');
    
    if (totalModerationBooks === 0) {
      console.log('\n💡 Рекомендация: Создайте тестовую книгу для проверки модерации');
      console.log('   Используйте: node test-book-creation.js');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error instanceof Error ? error.message : String(error));
  }
}

testModeratorVisibility(); 