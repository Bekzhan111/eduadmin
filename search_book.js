const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function searchBook() {
  const targetBaseUrl = "math-copy-1752660782735-e66k4i";
  
  console.log(`Searching for book with base_url: ${targetBaseUrl}`);
  
  try {
    // Search by base_url
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('base_url', targetBaseUrl)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Book not found in database');
        
        // Let's search for similar base_urls to understand the pattern
        const { data: similarBooks, error: searchError } = await supabase
          .from('books')
          .select('id, base_url, title, status, created_at')
          .like('base_url', '%math-copy%')
          .order('created_at', { ascending: false });
        
        if (searchError) {
          console.error('Error searching for similar books:', searchError);
        } else if (similarBooks && similarBooks.length > 0) {
          console.log('\n🔍 Found similar books with "math-copy" pattern:');
          similarBooks.forEach((book, index) => {
            console.log(`${index + 1}. ${book.base_url} - "${book.title}" (${book.status})`);
          });
        } else {
          console.log('\n🔍 No similar books found with "math-copy" pattern');
        }
        
        // Let's also check for books with similar timestamps
        const timestamp = '1752660782735';
        const { data: timestampBooks, error: timestampError } = await supabase
          .from('books')
          .select('id, base_url, title, status, created_at')
          .like('base_url', `%${timestamp}%`)
          .order('created_at', { ascending: false });
        
        if (timestampError) {
          console.error('Error searching by timestamp:', timestampError);
        } else if (timestampBooks && timestampBooks.length > 0) {
          console.log(`\n🕐 Found books with timestamp "${timestamp}":`);
          timestampBooks.forEach((book, index) => {
            console.log(`${index + 1}. ${book.base_url} - "${book.title}" (${book.status})`);
          });
        } else {
          console.log(`\n🕐 No books found with timestamp "${timestamp}"`);
        }
        
      } else {
        console.error('Database error:', error);
      }
      return;
    }
    
    console.log('\n✅ Book found!');
    console.log('Book details:');
    console.log('- ID:', book.id);
    console.log('- Base URL:', book.base_url);
    console.log('- Title:', book.title);
    console.log('- Status:', book.status);
    console.log('- Author ID:', book.author_id);
    console.log('- Created:', book.created_at);
    console.log('- Updated:', book.updated_at);
    console.log('- Grade Level:', book.grade_level);
    console.log('- Course:', book.course);
    console.log('- Category:', book.category);
    console.log('- Price:', book.price);
    console.log('- Cover Image:', book.cover_image);
    console.log('- Pages Count:', book.pages_count);
    console.log('- Language:', book.language);
    console.log('- Description:', book.description);
    
    // Check if book has collaboration records
    const { data: collaborators, error: collabError } = await supabase
      .from('book_collaborators')
      .select('user_id, role, created_at')
      .eq('book_id', book.id);
    
    if (collabError) {
      console.error('Error checking collaborators:', collabError);
    } else if (collaborators && collaborators.length > 0) {
      console.log('\n👥 Collaborators:');
      collaborators.forEach((collab, index) => {
        console.log(`${index + 1}. User ID: ${collab.user_id}, Role: ${collab.role}, Added: ${collab.created_at}`);
      });
    } else {
      console.log('\n👥 No collaborators found');
    }
    
    // Check if book has content
    if (book.canvas_elements) {
      console.log('\n📄 Book has canvas elements (content)');
    } else {
      console.log('\n📄 Book has no canvas elements (no content)');
    }
    
    if (book.structure) {
      console.log('📚 Book has structure data');
    } else {
      console.log('📚 Book has no structure data');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Also check the duplication logic
async function checkDuplicationLogic() {
  console.log('\n🔍 Checking recent duplication activity...');
  
  try {
    // Look for books with "-copy-" pattern in base_url
    const { data: copyBooks, error } = await supabase
      .from('books')
      .select('id, base_url, title, status, created_at, author_id')
      .like('base_url', '%-copy-%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error checking copy books:', error);
      return;
    }
    
    if (copyBooks && copyBooks.length > 0) {
      console.log('\n📋 Recent duplicated books:');
      copyBooks.forEach((book, index) => {
        console.log(`${index + 1}. ${book.base_url} - "${book.title}" (${book.status}) by ${book.author_id}`);
        console.log(`   Created: ${book.created_at}`);
      });
    } else {
      console.log('\n📋 No duplicated books found');
    }
    
    // Check for books with similar naming patterns
    const { data: mathBooks, error: mathError } = await supabase
      .from('books')
      .select('id, base_url, title, status, created_at, author_id')
      .like('base_url', '%math%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (mathError) {
      console.error('Error checking math books:', mathError);
    } else if (mathBooks && mathBooks.length > 0) {
      console.log('\n📐 Math-related books:');
      mathBooks.forEach((book, index) => {
        console.log(`${index + 1}. ${book.base_url} - "${book.title}" (${book.status})`);
      });
    }
    
  } catch (error) {
    console.error('Error in duplication check:', error);
  }
}

async function main() {
  await searchBook();
  await checkDuplicationLogic();
}

main();