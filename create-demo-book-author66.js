const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createDemoBookForAuthor66() {
  console.log('🔄 Создаем демо-книгу для author66...\n');
  
  try {
    // 1. Найдем автора author66
    console.log('👤 Шаг 1: Поиск автора author66');
    const { data: authors, error: authorsError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'author66@test.com')
      .eq('role', 'author')
      .single();
    
    if (authorsError || !authors) {
      console.error('❌ Автор author66@test.com не найден:', authorsError);
      return;
    }
    
    const author = authors;
    console.log(`✅ Найден автор: ${author.email}`);
    
    // 2. Создаем книгу
    console.log('\n📖 Шаг 2: Создание демо-книги');
    const bookData = {
      title: 'Редактор Страниц - Демо для Author66',
      description: 'Демонстрация возможностей редактора страниц книги для author66',
      author_id: author.id,
      base_url: `author66-demo-book-${Date.now()}`,
      status: 'Draft',
      canvas_elements: JSON.stringify([
        {
          id: 'welcome_title',
          type: 'text',
          x: 50,
          y: 30,
          width: 300,
          height: 50,
          content: 'Добро пожаловать, Author66!',
          page: 1,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 28,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#1f2937',
            textAlign: 'center',
            backgroundColor: 'transparent'
          }
        },
        {
          id: 'intro_text',
          type: 'paragraph',
          x: 30,
          y: 100,
          width: 340,
          height: 120,
          content: 'Это ваш персональный редактор страниц книги.\n\n• Используйте панель страниц слева для навигации\n• Добавляйте новые страницы кнопкой "+"\n• Перетаскивайте элементы из панели инструментов\n• Редактируйте свойства элементов справа',
          page: 1,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#374151',
            textAlign: 'left',
            backgroundColor: '#f0f9ff',
            borderWidth: 1,
            borderColor: '#0ea5e9',
            borderRadius: 8
          }
        },
        {
          id: 'page2_title',
          type: 'text',
          x: 100,
          y: 50,
          width: 200,
          height: 40,
          content: 'Страница 2',
          page: 2,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#0ea5e9',
            textAlign: 'center'
          }
        },
        {
          id: 'author66_circle',
          type: 'shape',
          x: 120,
          y: 120,
          width: 80,
          height: 80,
          content: '',
          page: 2,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            shapeType: 'circle',
            backgroundColor: '#0ea5e9',
            borderWidth: 3,
            borderColor: '#0369a1',
            borderStyle: 'solid'
          }
        },
        {
          id: 'page2_text',
          type: 'paragraph',
          x: 50,
          y: 220,
          width: 300,
          height: 80,
          content: 'Привет, Author66!\n\nЭто ваша вторая страница. Вы можете добавлять сколько угодно страниц и создавать уникальный контент на каждой из них.',
          page: 2,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#1e40af',
            textAlign: 'left'
          }
        },
        {
          id: 'page3_title',
          type: 'text',
          x: 80,
          y: 40,
          width: 240,
          height: 40,
          content: 'Страница 3 - Пример',
          page: 3,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 22,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#059669',
            textAlign: 'center'
          }
        },
        {
          id: 'green_rect',
          type: 'shape',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          content: '',
          page: 3,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            shapeType: 'rectangle',
            backgroundColor: '#10b981',
            borderWidth: 2,
            borderColor: '#059669',
            borderStyle: 'solid',
            borderRadius: 12
          }
        },
        {
          id: 'page3_text',
          type: 'paragraph',
          x: 50,
          y: 220,
          width: 300,
          height: 60,
          content: 'Третья страница показывает, как легко добавлять новые страницы и работать с множественным контентом.',
          page: 3,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#065f46',
            textAlign: 'center'
          }
        }
      ]),
      canvas_settings: JSON.stringify({
        zoom: 100,
        currentPage: 1,
        totalPages: 3,
        canvasWidth: 210,
        canvasHeight: 297,
        showGrid: false,
        twoPageView: false
      })
    };
    
    const { data: book, error: bookError } = await serviceClient
      .from('books')
      .insert(bookData)
      .select()
      .single();
    
    if (bookError) {
      console.error('❌ Ошибка создания книги:', bookError);
      return;
    }
    
    console.log('✅ Демо-книга создана успешно!');
    console.log(`📚 Название: ${book.title}`);
    console.log(`🔗 URL: ${book.base_url}`);
    
    console.log('\n🎉 Данные для входа:');
    console.log(`   Email: ${author.email}`);
    console.log(`   Пароль: password123 (или demo123456)`);
    console.log(`\n📖 Редактор доступен по адресу:`);
    console.log(`   http://localhost:3000/dashboard/books/${book.base_url}/edit`);
    
    return book;
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем создание
createDemoBookForAuthor66()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 