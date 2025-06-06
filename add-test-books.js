const { createClient } = require('@supabase/supabase-js');

// Используем переменные окружения из .env.local
const supabaseUrl = 'https://wxrqdytayiamnpwjauvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cnFkeXRheWlhbW5wd2phdXZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc0MzQxOCwiZXhwIjoyMDYzMzE5NDE4fQ.oLcBI0WFeFwB5HtMAJz8c60BuQYDKVfkql3_-ranFFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestBooks() {
  console.log('🔍 Проверяем существующие книги...');
  
  // Проверяем, есть ли уже книги
  const { data: existingBooks, error: booksError } = await supabase
    .from('books')
    .select('id, title, status')
    .eq('status', 'Active');
    
  if (booksError) {
    console.error('❌ Ошибка при проверке книг:', booksError);
    console.log('🔧 Возможно, таблица books не существует. Попробуем создать тестовые данные...');
  } else {
    console.log('📚 Существующие активные книги:', existingBooks?.length || 0);
    
    if (existingBooks && existingBooks.length > 0) {
      console.log('✅ Активные книги уже существуют:');
      existingBooks.forEach(book => {
        console.log(`  - ${book.title} (${book.status})`);
      });
      return;
    }
  }
  
  // Добавляем тестовые книги
  const testBooks = [
    {
      title: 'Основы Web-разработки',
      description: 'Комплексное руководство по изучению современных технологий веб-разработки, включая HTML, CSS, JavaScript и React. Эта книга доступна для свободного чтения всем пользователям.',
      grade_level: '10',
      course: 'Информатика',
      category: 'Учебник',
      status: 'Active',
      base_url: 'osnovy-web-razrabotki',
      pages_count: 150,
      language: 'Русский'
    },
    {
      title: 'Математика для начинающих',
      description: 'Увлекательное введение в мир математики для школьников. Содержит понятные объяснения и множество практических примеров.',
      grade_level: '8',
      course: 'Математика',
      category: 'Учебник',
      status: 'Active',
      base_url: 'matematika-dlya-nachinayushchikh',
      pages_count: 200,
      language: 'Русский'
    },
    {
      title: 'История России',
      description: 'Подробный обзор ключевых событий российской истории с древних времен до наших дней.',
      grade_level: '9',
      course: 'История',
      category: 'Учебник',
      status: 'Active',
      base_url: 'istoriya-rossii',
      pages_count: 300,
      language: 'Русский'
    }
  ];
  
  console.log('📝 Добавляем тестовые книги...');
  
  const { data: insertedBooks, error: insertError } = await supabase
    .from('books')
    .insert(testBooks)
    .select();
    
  if (insertError) {
    console.error('❌ Ошибка при добавлении книг:', insertError);
    return;
  }
  
  console.log('✅ Успешно добавлено книг:', insertedBooks?.length || 0);
  insertedBooks?.forEach(book => {
    console.log(`  - ${book.title} (ID: ${book.id})`);
  });
  
  // Добавляем тестовые главы для первой книги
  if (insertedBooks && insertedBooks.length > 0) {
    const firstBook = insertedBooks[0];
    
    const testChapters = [
      {
        book_id: firstBook.id,
        title: 'Введение в веб-разработку',
        content: '<h1>Введение в веб-разработку</h1><p>Добро пожаловать в мир веб-разработки! В этой главе мы рассмотрим основные концепции и технологии.</p>',
        order_index: 1,
        status: 'Active'
      },
      {
        book_id: firstBook.id,
        title: 'HTML основы',
        content: '<h1>HTML основы</h1><p>HTML (HyperText Markup Language) - это язык разметки для создания веб-страниц.</p>',
        order_index: 2,
        status: 'Active'
      },
      {
        book_id: firstBook.id,
        title: 'CSS стилизация',
        content: '<h1>CSS стилизация</h1><p>CSS (Cascading Style Sheets) позволяет стилизовать HTML элементы.</p>',
        order_index: 3,
        status: 'Active'
      }
    ];
    
    const { data: insertedChapters, error: chaptersError } = await supabase
      .from('chapters')
      .insert(testChapters)
      .select();
      
    if (chaptersError) {
      console.error('❌ Ошибка при добавлении глав:', chaptersError);
    } else {
      console.log('✅ Успешно добавлено глав:', insertedChapters?.length || 0);
    }
  }
}

addTestBooks().catch(console.error); 