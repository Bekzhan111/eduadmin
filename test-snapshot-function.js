// Test script to check the Supabase connection and function availability
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or anon key');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined in your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection with a simple query
    const { data: connectionTest, error: connectionError } = await supabase
      .from('books')
      .select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      throw connectionError;
    }
    
    console.log('✅ Connection successful');
    
    // Test if the function exists
    console.log('Checking if save_book_edit_snapshot function exists...');
    const { data: functionTest, error: functionError } = await supabase.rpc(
      'check_function_exists',
      { function_name: 'save_book_edit_snapshot' }
    );
    
    if (functionError) {
      console.log('❌ Could not check function existence:', functionError.message);
      console.log('This may be because the check_function_exists helper function does not exist.');
    } else {
      console.log('Function exists:', functionTest);
    }
    
    // Get a sample book ID for testing
    console.log('Getting a sample book ID for testing...');
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id')
      .limit(1);
    
    if (booksError) {
      throw booksError;
    }
    
    if (!books || books.length === 0) {
      console.log('❌ No books found for testing');
      return;
    }
    
    const testBookId = books[0].id;
    console.log(`Found book ID for testing: ${testBookId}`);
    
    // Test the function with a sample book
    console.log('Testing save_book_edit_snapshot function...');
    const { data: result, error: saveError } = await supabase.rpc(
      'save_book_edit_snapshot',
      {
        book_uuid: testBookId,
        snapshot_name: 'Test Snapshot',
        description: 'Created by test script'
      }
    );
    
    if (saveError) {
      console.log('❌ Function test failed:', saveError.message);
      console.log('Error details:', saveError);
    } else {
      console.log('✅ Function test successful!');
      console.log('Result:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection(); 
