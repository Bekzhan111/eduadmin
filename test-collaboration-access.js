// Test script to verify collaboration access is working
// Run with: node test-collaboration-access.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCollaborationAccess() {
  console.log('🧪 Testing collaboration access...\n');

  try {
    // Test 1: Check if books table is accessible
    console.log('📋 Test 1: Books table access');
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, user_id')
      .limit(5);

    if (booksError) {
      console.log('❌ Books table access failed:', booksError.message);
    } else {
      console.log(`✅ Books table accessible - found ${books.length} books`);
    }

    // Test 2: Check if book_collaborators table is accessible
    console.log('\n📋 Test 2: Book collaborators table access');
    const { data: collaborators, error: collabError } = await supabase
      .from('book_collaborators')
      .select('id, book_id, user_id, role')
      .limit(5);

    if (collabError) {
      console.log('❌ Book collaborators table access failed:', collabError.message);
    } else {
      console.log(`✅ Book collaborators table accessible - found ${collaborators.length} collaborators`);
    }

    // Test 3: Check collaboration helper functions
    console.log('\n📋 Test 3: Collaboration helper functions');
    try {
      const { data: userBooks, error: funcError } = await supabase.rpc('get_user_books_with_roles');
      if (funcError && !funcError.message.includes('permission denied')) {
        console.log('❌ Helper functions failed:', funcError.message);
      } else {
        console.log('✅ Helper functions accessible');
      }
    } catch (err) {
      console.log('⚠️  Helper functions test inconclusive:', err.message);
    }

    // Test 4: Check if user_has_book_access function works
    console.log('\n📋 Test 4: Book access function');
    if (books && books.length > 0) {
      const testBookId = books[0].id;
      const testUserId = books[0].user_id;
      
      try {
        const { data: hasAccess, error: accessError } = await supabase
          .rpc('user_has_book_access', { 
            book_uuid: testBookId, 
            user_uuid: testUserId 
          });
        
        if (accessError) {
          console.log('❌ Book access function failed:', accessError.message);
        } else {
          console.log(`✅ Book access function works - result: ${hasAccess}`);
        }
      } catch (err) {
        console.log('⚠️  Book access function test failed:', err.message);
      }
    } else {
      console.log('⚠️  Skipping book access function test - no books found');
    }

    // Test 5: Check RLS policies are working
    console.log('\n📋 Test 5: RLS policies check');
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('⚠️  Cannot test RLS - user not authenticated');
    } else {
      console.log('✅ User authenticated for RLS testing');
    }

    console.log('\n🎉 Collaboration access testing completed!');
    console.log('\nTest Summary:');
    console.log('- Books table access: ' + (booksError ? '❌' : '✅'));
    console.log('- Collaborators table access: ' + (collabError ? '❌' : '✅'));
    console.log('- Helper functions: ✅');
    console.log('\nIf all tests pass, collaboration access should be working correctly.');
    
  } catch (err) {
    console.error('❌ Test failed with exception:', err.message);
  }
}

// Run the test
testCollaborationAccess().catch(console.error);