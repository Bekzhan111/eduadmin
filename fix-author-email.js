const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function fixAuthorEmail() {
  console.log('🔧 Исправление email автора\n');
  
  try {
    // Находим автора с null email
    const { data: authors, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'author')
      .is('email', null);
      
    if (error) {
      console.error('❌ Ошибка поиска автора:', error.message);
      return;
    }
    
    if (!authors || authors.length === 0) {
      console.log('⚠️ Авторы с null email не найдены');
      return;
    }
    
    const author = authors[0];
    console.log(`👤 Найден автор с ID: ${author.id}`);
    
    // Обновляем email
    const newEmail = 'test-author-fixed@example.com';
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', author.id);
      
    if (updateError) {
      console.error('❌ Ошибка обновления email:', updateError.message);
      return;
    }
    
    console.log(`✅ Email обновлен на: ${newEmail}`);
    
    // Проверяем результат
    const { data: updatedAuthor, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', author.id)
      .single();
      
    if (checkError) {
      console.error('❌ Ошибка проверки:', checkError.message);
    } else {
      console.log('\n📊 Обновленные данные автора:');
      console.log(`   ID: ${updatedAuthor.id}`);
      console.log(`   Email: ${updatedAuthor.email}`);
      console.log(`   Роль: ${updatedAuthor.role}`);
      
      console.log('\n🎯 Данные для входа:');
      console.log(`   Email: ${updatedAuthor.email}`);
      console.log(`   Password: TestPassword123!`);
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

fixAuthorEmail(); 