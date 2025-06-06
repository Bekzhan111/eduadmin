const { createClient } = require('@supabase/supabase-js');

// Используем переменные окружения из .env.local
const supabaseUrl = 'https://wxrqdytayiamnpwjauvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cnFkeXRheWlhbW5wd2phdXZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc0MzQxOCwiZXhwIjoyMDYzMzE5NDE4fQ.oLcBI0WFeFwB5HtMAJz8c60BuQYDKVfkql3_-ranFFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookUrls() {
  console.log('🔍 Проверяем base_url всех активных книг...');
  
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, base_url, status')
    .eq('status', 'Active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Ошибка при получении книг:', error);
    return;
  }
  
  console.log(`📚 Найдено ${books?.length || 0} активных книг:`);
  console.log('');
  
  books?.forEach((book, index) => {
    console.log(`${index + 1}. "${book.title}"`);
    console.log(`   ID: ${book.id}`);
    console.log(`   base_url: "${book.base_url}"`);
    console.log(`   Ссылка для чтения: /read/${book.base_url}`);
    console.log('');
  });
  
  // Попробуем найти конкретную книгу из примера
  const testUrl = 'test-book-1748884702744-copy-1748982457209';
  console.log(`🔍 Ищем книгу с base_url: "${testUrl}"`);
  
  const { data: specificBook, error: specificError } = await supabase
    .from('books')
    .select('id, title, base_url, status')
    .eq('base_url', testUrl)
    .single();
    
  if (specificError) {
    console.log(`❌ Книга с base_url "${testUrl}" НЕ НАЙДЕНА`);
    console.log('   Ошибка:', specificError.message);
  } else {
    console.log(`✅ Книга найдена: "${specificBook.title}"`);
  }
}

checkBookUrls().catch(console.error); 