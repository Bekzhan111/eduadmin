const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function analyzeDuplication() {
  const targetBaseUrl = "math-copy-1752660782735-e66k4i";
  
  console.log(`Analyzing duplication for book: ${targetBaseUrl}`);
  
  try {
    // Get the copied book
    const { data: copiedBook, error } = await supabase
      .from('books')
      .select('*')
      .eq('base_url', targetBaseUrl)
      .single();
    
    if (error) {
      console.error('Error finding copied book:', error);
      return;
    }
    
    console.log('\n📋 Copied Book Details:');
    console.log('- ID:', copiedBook.id);
    console.log('- Base URL:', copiedBook.base_url);
    console.log('- Title:', copiedBook.title);
    console.log('- Status:', copiedBook.status);
    console.log('- Author ID:', copiedBook.author_id);
    console.log('- Created:', copiedBook.created_at);
    
    // Extract the original base_url from the copied book's base_url
    // Pattern: originalBaseUrl-copy-timestamp-randomString
    const originalBaseUrl = copiedBook.base_url.split('-copy-')[0];
    console.log(`\n🔍 Searching for original book with base_url: ${originalBaseUrl}`);
    
    // Find the original book
    const { data: originalBook, error: originalError } = await supabase
      .from('books')
      .select('*')
      .eq('base_url', originalBaseUrl)
      .single();
    
    if (originalError) {
      if (originalError.code === 'PGRST116') {
        console.log('❌ Original book not found in database');
        
        // Let's search for similar base_urls
        const { data: similarBooks } = await supabase
          .from('books')
          .select('id, base_url, title, status, created_at')
          .like('base_url', `%${originalBaseUrl}%`)
          .order('created_at', { ascending: false });
        
        if (similarBooks && similarBooks.length > 0) {
          console.log('\n🔍 Found similar books:');
          similarBooks.forEach((book, index) => {
            console.log(`${index + 1}. ${book.base_url} - "${book.title}" (${book.status})`);
          });
        }
      } else {
        console.error('Error finding original book:', originalError);
      }
      return;
    }
    
    console.log('\n✅ Original Book Found!');
    console.log('- ID:', originalBook.id);
    console.log('- Base URL:', originalBook.base_url);
    console.log('- Title:', originalBook.title);
    console.log('- Status:', originalBook.status);
    console.log('- Author ID:', originalBook.author_id);
    console.log('- Created:', originalBook.created_at);
    
    // Compare the two books
    console.log('\n🔄 Duplication Analysis:');
    console.log('- Original Title:', originalBook.title);
    console.log('- Copied Title:', copiedBook.title);
    console.log('- Title changed correctly:', copiedBook.title === `${originalBook.title} (Копия)`);
    console.log('- Original Author:', originalBook.author_id);
    console.log('- New Author:', copiedBook.author_id);
    console.log('- Author changed:', originalBook.author_id !== copiedBook.author_id);
    console.log('- Original Status:', originalBook.status);
    console.log('- Copied Status:', copiedBook.status);
    console.log('- Status reset to Draft:', copiedBook.status === 'Draft');
    
    // Check content duplication
    console.log('\n📄 Content Analysis:');
    console.log('- Original has canvas_elements:', !!originalBook.canvas_elements);
    console.log('- Copy has canvas_elements:', !!copiedBook.canvas_elements);
    console.log('- Original has structure:', !!originalBook.structure);
    console.log('- Copy has structure:', !!copiedBook.structure);
    
    if (originalBook.canvas_elements && copiedBook.canvas_elements) {
      console.log('- Content copied successfully');
    } else {
      console.log('- Content may not have been copied correctly');
    }
    
    // Check collaboration records
    const { data: originalCollabs } = await supabase
      .from('book_collaborators')
      .select('user_id, role')
      .eq('book_id', originalBook.id);
    
    const { data: copiedCollabs } = await supabase
      .from('book_collaborators')
      .select('user_id, role')
      .eq('book_id', copiedBook.id);
    
    console.log('\n👥 Collaboration Analysis:');
    console.log('- Original collaborators:', originalCollabs?.length || 0);
    console.log('- Copied collaborators:', copiedCollabs?.length || 0);
    
    if (originalCollabs && originalCollabs.length > 0) {
      console.log('- Original collaborators:');
      originalCollabs.forEach((collab, index) => {
        console.log(`  ${index + 1}. User: ${collab.user_id}, Role: ${collab.role}`);
      });
    }
    
    if (copiedCollabs && copiedCollabs.length > 0) {
      console.log('- Copied collaborators:');
      copiedCollabs.forEach((collab, index) => {
        console.log(`  ${index + 1}. User: ${collab.user_id}, Role: ${collab.role}`);
      });
    }
    
    // Check the duplication timestamp
    const copiedTimestamp = copiedBook.created_at;
    const baseUrlTimestamp = targetBaseUrl.split('-copy-')[1].split('-')[0];
    
    console.log('\n⏰ Timestamp Analysis:');
    console.log('- Book created at:', copiedTimestamp);
    console.log('- Base URL timestamp:', baseUrlTimestamp);
    console.log('- Timestamps match:', copiedTimestamp.includes(baseUrlTimestamp));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function checkDuplicationLogic() {
  console.log('\n🔧 Checking Duplication Logic from Code...');
  
  // Based on the code from the dashboard, let's understand what should happen
  console.log('\n📝 Expected Duplication Process:');
  console.log('1. Generate unique base_url: originalBaseUrl-copy-timestamp-randomString');
  console.log('2. Set title to: originalTitle + " (Копия)"');
  console.log('3. Set current user as author_id');
  console.log('4. Set status to "Draft"');
  console.log('5. Copy canvas_elements, structure, and canvas_settings');
  console.log('6. Create ownership collaboration record');
  console.log('7. Reset statistics (downloads_count, etc.)');
  
  // Let's check the pattern in the database
  const { data: recentCopies } = await supabase
    .from('books')
    .select('id, base_url, title, status, author_id, created_at')
    .like('base_url', '%-copy-%')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentCopies && recentCopies.length > 0) {
    console.log('\n📊 Recent Duplication Patterns:');
    recentCopies.forEach((book, index) => {
      const parts = book.base_url.split('-copy-');
      const originalBaseUrl = parts[0];
      const timestampPart = parts[1] || '';
      
      console.log(`${index + 1}. ${book.base_url}`);
      console.log(`   Original: ${originalBaseUrl}`);
      console.log(`   Timestamp: ${timestampPart}`);
      console.log(`   Title: ${book.title}`);
      console.log(`   Status: ${book.status}`);
      console.log(`   Author: ${book.author_id}`);
      console.log(`   Created: ${book.created_at}`);
      console.log('');
    });
  }
}

async function main() {
  await analyzeDuplication();
  await checkDuplicationLogic();
}

main();