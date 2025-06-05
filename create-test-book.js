const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createTestBook() {
  console.log('🔄 Создаем тестовую книгу для демонстрации редактора...');
  
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
    
    // 2. Создаем книгу
    console.log('\n📖 Шаг 2: Создание тестовой книги');
    const bookData = {
      title: 'Моя Первая Книга',
      description: 'Тестовая книга для демонстрации редактора страниц',
      author_id: author.id,
      base_url: `test-book-${Date.now()}`,
      status: 'Draft',
      canvas_elements: JSON.stringify([
        {
          id: 'element_1',
          type: 'text',
          x: 100,
          y: 50,
          width: 200,
          height: 40,
          content: 'Добро пожаловать в редактор!',
          page: 1,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333333',
            textAlign: 'center'
          }
        },
        {
          id: 'element_2',
          type: 'paragraph',
          x: 50,
          y: 120,
          width: 300,
          height: 100,
          content: 'Это первая страница вашей книги.\n\nВы можете добавлять текст, изображения, фигуры и многое другое!\n\nИспользуйте панель страниц слева для навигации.',
          page: 1,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#666666',
            textAlign: 'left'
          }
        },
        {
          id: 'element_3',
          type: 'text',
          x: 100,
          y: 50,
          width: 200,
          height: 40,
          content: 'Вторая страница',
          page: 2,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 20,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#2563eb',
            textAlign: 'center'
          }
        },
        {
          id: 'element_4',
          type: 'shape',
          x: 150,
          y: 150,
          width: 100,
          height: 100,
          content: '',
          page: 2,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            shapeType: 'circle',
            backgroundColor: '#60a5fa',
            borderWidth: 2,
            borderColor: '#2563eb'
          }
        }
      ]),
      canvas_settings: JSON.stringify({
        zoom: 100,
        currentPage: 1,
        totalPages: 2,
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
    
    console.log('✅ Книга создана успешно!');
    console.log(`📚 Название: ${book.title}`);
    console.log(`🔗 URL: ${book.base_url}`);
    console.log(`👤 Автор: ${author.email}`);
    console.log(`\n🎉 Редактор доступен по адресу:`);
    console.log(`   http://localhost:3000/dashboard/books/${book.base_url}/edit`);
    
    return book;
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем создание книги
createTestBook()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 