const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createDemoBook() {
  console.log('🔄 Создаем демо-книгу...\n');
  
  try {
    // 1. Найдем любого автора
    console.log('👤 Шаг 1: Поиск автора');
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
    console.log('💡 Попробуйте войти с паролем: demo123456 или password123');
    
    // 2. Создаем книгу
    console.log('\n📖 Шаг 2: Создание демо-книги');
    const bookData = {
      title: 'Редактор Страниц - Демо',
      description: 'Демонстрация возможностей редактора страниц книги',
      author_id: author.id,
      base_url: `demo-book-${Date.now()}`,
      status: 'Draft',
      canvas_elements: JSON.stringify([
        {
          id: 'welcome_title',
          type: 'text',
          x: 50,
          y: 30,
          width: 300,
          height: 50,
          content: 'Добро пожаловать в редактор!',
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
          content: 'Это демонстрация редактора страниц книги.\n\n• Используйте панель страниц слева для навигации\n• Добавляйте новые страницы кнопкой "+"\n• Перетаскивайте элементы из панели инструментов\n• Редактируйте свойства элементов справа',
          page: 1,
          zIndex: 2,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#374151',
            textAlign: 'left',
            backgroundColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#e5e7eb',
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
          content: 'Вторая страница',
          page: 2,
          zIndex: 1,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#2563eb',
            textAlign: 'center'
          }
        },
        {
          id: 'blue_circle',
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
            backgroundColor: '#60a5fa',
            borderWidth: 3,
            borderColor: '#2563eb',
            borderStyle: 'solid'
          }
        },
        {
          id: 'page2_text',
          type: 'paragraph',
          x: 50,
          y: 220,
          width: 300,
          height: 60,
          content: 'Здесь можно добавить больше контента.\n\nКаждая страница может содержать свои уникальные элементы.',
          page: 2,
          zIndex: 3,
          rotation: 0,
          opacity: 1,
          properties: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#4b5563',
            textAlign: 'left'
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
    
    console.log('✅ Демо-книга создана успешно!');
    console.log(`📚 Название: ${book.title}`);
    console.log(`🔗 URL: ${book.base_url}`);
    
    console.log('\n🎉 Данные для входа:');
    console.log(`   Email: ${author.email}`);
    console.log(`   Пароль: demo123456 (попробуйте также password123)`);
    console.log(`\n📖 Редактор доступен по адресу:`);
    console.log(`   http://localhost:3000/dashboard/books/${book.base_url}/edit`);
    
    return book;
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем создание
createDemoBook()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 