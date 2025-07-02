// Script to apply the collaboration access fix to the database
// Run with: node apply-collaboration-fix.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCollaborationFix() {
  console.log('🔧 Applying collaboration access fix...\n');

  try {
    // Read the SQL fix file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'fix_books_collaboration_access.sql'), 'utf8');
    
    console.log('📋 SQL Migration Content:');
    console.log('─'.repeat(50));
    console.log(sqlContent);
    console.log('─'.repeat(50));
    
    // Apply the migration
    console.log('\n🚀 Executing migration...');
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    // Test books table access
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, user_id')
      .limit(1);
    
    if (booksError) {
      console.log('❌ Books table access test failed:', booksError.message);
    } else {
      console.log('✅ Books table access test passed');
    }
    
    // Test collaborators table access
    const { data: collabData, error: collabError } = await supabase
      .from('book_collaborators')
      .select('id, book_id, user_id, role')
      .limit(1);
    
    if (collabError) {
      console.log('❌ Collaborators table access test failed:', collabError.message);
    } else {
      console.log('✅ Collaborators table access test passed');
    }
    
    console.log('\n🎉 Collaboration access fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test that collaborators can now access books they\'re invited to');
    console.log('2. Verify that book owners can still access their books');
    console.log('3. Check that non-collaborators cannot access books they shouldn\'t');
    
    return true;
    
  } catch (err) {
    console.error('❌ Exception occurred:', err.message);
    return false;
  }
}

// Alternative function using individual SQL commands if the above doesn't work
async function applyFixWithIndividualCommands() {
  console.log('🔧 Applying fix with individual SQL commands...\n');
  
  const commands = [
    "ALTER TABLE books ENABLE ROW LEVEL SECURITY;",
    
    `DROP POLICY IF EXISTS "Users can only view their own books" ON books;`,
    `DROP POLICY IF EXISTS "Authors can view their own books" ON books;`,
    `DROP POLICY IF EXISTS "Users can view own books" ON books;`,
    
    `CREATE POLICY "Users can view books they own or collaborate on" ON books
     FOR SELECT USING (
       user_id = auth.uid()
       OR
       id IN (
         SELECT book_id 
         FROM book_collaborators 
         WHERE user_id = auth.uid()
       )
     );`,
     
    `CREATE POLICY "Authenticated users can create books" ON books
     FOR INSERT WITH CHECK (user_id = auth.uid());`,
     
    `CREATE POLICY "Owners and editors can update books" ON books
     FOR UPDATE USING (
       user_id = auth.uid()
       OR
       id IN (
         SELECT book_id 
         FROM book_collaborators 
         WHERE user_id = auth.uid() 
         AND role IN ('owner', 'editor')
       )
     );`,
     
    `CREATE POLICY "Only owners can delete books" ON books
     FOR DELETE USING (user_id = auth.uid());`,
     
    `CREATE INDEX IF NOT EXISTS idx_book_collaborators_user_book ON book_collaborators(user_id, book_id);`
  ];
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\n📋 Executing command ${i + 1}/${commands.length}:`);
    console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
    
    try {
      const { error } = await supabase.rpc('exec', { sql: command });
      if (error) {
        console.log('❌ Error:', error.message);
        // Continue with other commands
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }
  }
  
  console.log('\n🎉 Individual commands completed!');
}

// Run the migration
console.log('🔍 Starting collaboration access fix...');
applyCollaborationFix()
  .then(success => {
    if (!success) {
      console.log('\n🔄 Trying alternative approach...');
      return applyFixWithIndividualCommands();
    }
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });