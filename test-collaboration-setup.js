// Test script to verify collaboration database setup
// Run this with: node test-collaboration-setup.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCollaborationTables() {
  console.log('🧪 Testing collaboration database setup...\n');

  const tables = [
    'book_collaborators',
    'collaboration_invitations', 
    'editing_sessions',
    'user_presence',
    'book_comments'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Testing table: ${table}`);
      
      // Test basic read access to table structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0); // Don't return any data, just test the query

      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Exception testing ${table}:`, err.message);
    }
  }

  // Test helper functions
  console.log('\n🔧 Testing helper functions...');
  
  try {
    // Test a read-only helper function
    const { data, error } = await supabase.rpc('get_user_books_with_roles');
    if (error && !error.message.includes('permission denied')) {
      console.log('❌ Helper functions may not be installed:', error.message);
    } else {
      console.log('✅ Helper functions appear to be available');
    }
  } catch (err) {
    console.log('❌ Error testing helper functions:', err.message);
  }

  console.log('\n🎉 Database setup test completed');
}

// Run the test
testCollaborationTables().catch(console.error);