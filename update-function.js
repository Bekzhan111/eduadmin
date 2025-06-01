const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Читаем переменные окружения
require('dotenv').config();

async function updateDashboardFunction() {
  try {
    // Создаем клиент Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Отсутствуют переменные окружения NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Читаем SQL файл
    const sqlContent = fs.readFileSync(path.join(__dirname, 'update-dashboard-function.sql'), 'utf8');
    
    console.log('Выполняем обновление функции get_dashboard_summary...');
    
    // Разделяем SQL на отдельные команды
    const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim());
    
    for (const command of sqlCommands) {
      if (command.trim()) {
        console.log('Выполняем команду:', command.substring(0, 80) + '...');
        
        try {
          // Выполняем SQL команду напрямую
          const { data, error } = await supabase.from('_').select('*').limit(0);
          
          // Используем rpc для выполнения SQL
          const { error: sqlError } = await supabase.rpc('exec', { 
            sql: command.trim() 
          }).single();
          
          if (sqlError) {
            console.log('Попытка через прямой SQL...');
            // Если rpc не работает, попробуем через query
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql: command.trim() })
            });
            
            if (!response.ok) {
              console.error('Ошибка HTTP:', response.status, response.statusText);
            } else {
              console.log('Команда выполнена успешно');
            }
          } else {
            console.log('Команда выполнена через RPC');
          }
        } catch (cmdError) {
          console.log('Ошибка команды:', cmdError.message);
        }
      }
    }
    
    console.log('Обновление завершено!');
    
  } catch (error) {
    console.error('Общая ошибка:', error);
  }
}

updateDashboardFunction(); 