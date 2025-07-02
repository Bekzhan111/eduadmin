// Simple script to check if collaboration tables exist
// Run with: node check-collaboration-tables.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking collaboration tables...\n');

  const tables = [
    'book_collaborators',
    'collaboration_invitations', 
    'editing_sessions',
    'user_presence',
    'book_comments'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ Table ${table} does not exist - need to run migrations`);
        } else {
          console.log(`⚠️  Table ${table} exists but query failed:`, error.message);
        }
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Exception checking ${table}:`, err.message);
    }
  }

  console.log('\n📝 If tables are missing, you need to:');
  console.log('1. Apply the migration files in supabase/migrations/');
  console.log('2. Or run: supabase db push (if using Supabase CLI)');
  console.log('3. Or manually run the SQL files in your Supabase dashboard');
}

checkTables().catch(console.error);