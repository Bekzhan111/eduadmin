const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function updateFunction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('Проверяем подключение к Supabase...');
  
  // Проверим, можем ли мы вызвать существующую функцию
  try {
    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.log('Ошибка при вызове функции:', error.message);
      if (error.message.includes('User not found')) {
        console.log('✅ Функция существует и работает (ошибка "User not found" ожидаема)');
      }
    } else {
      console.log('✅ Функция работает, данные:', data);
    }
  } catch (err) {
    console.log('❌ Ошибка подключения:', err.message);
  }
  
  // Попробуем получить список функций
  try {
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_dashboard_summary');
      
    if (funcError) {
      console.log('Не удалось получить список функций:', funcError.message);
    } else {
      console.log('Найденные функции:', functions);
    }
  } catch (err) {
    console.log('Ошибка при поиске функций:', err.message);
  }
}

updateFunction(); 