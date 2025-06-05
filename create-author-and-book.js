const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function createAuthorAndBook() {
  console.log('🔄 Создаем нового автора и тестовую книгу...\n');
  
  try {
    // 1. Создаем автора
    console.log('👤 Шаг 1: Создание автора');
    const authorEmail = `demo-author-${Date.now()}@example.com`;
    const authorPassword = 'demo123456';
    
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: authorEmail,
      password: authorPassword,
      email_confirm: true,
      user_metadata: {
        role: 'author',
        full_name: 'Демо Автор'
      }
    });
    
    if (authError) {
      console.error('❌ Ошибка создания автора:', authError);
      return;
    }
    
    console.log(`✅ Автор создан: ${authorEmail}`);
    
    // 2. Добавляем в таблицу users
    const { error: insertError } = await serviceClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: 'author'
      });
    
    if (insertError) {
      console.error('❌ Ошибка добавления в таблицу users:', insertError);
      return;
    }
    
    console.log('✅ Автор добавлен в базу данных');
    
    // 3. Создаем книгу
    console.log('\n📖 Шаг 2: Создание тестовой книги');
    const bookData = {
      title: 'Редактор Страниц - Демо',
      description: 'Демонстрация возможностей редактора страниц книги',
      author_id: authData.user.id,
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
    
    console.log('✅ Книга создана успешно!');
    console.log(`📚 Название: ${book.title}`);
    console.log(`🔗 URL: ${book.base_url}`);
    
    console.log('\n🎉 Готово! Данные для входа:');
    console.log(`   Email: ${authorEmail}`);
    console.log(`   Пароль: ${authorPassword}`);
    console.log(`\n📖 Редактор доступен по адресу:`);
    console.log(`   http://localhost:3000/dashboard/books/${book.base_url}/edit`);
    
    return { author: authData.user, book };
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем создание
createAuthorAndBook()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 