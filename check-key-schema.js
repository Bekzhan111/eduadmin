const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
);

async function checkKeySchema() {
  try {
    const { data, error } = await supabase
      .from('registration_keys')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Ошибка:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Схема таблицы registration_keys:');
      console.log(Object.keys(data[0]));
      console.log('\n📝 Пример записи:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('💥 Ошибка:', error);
  }
}

checkKeySchema(); 