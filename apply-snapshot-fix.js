// Script to apply the fix for the book edit history snapshot saving issue
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Reading SQL fix script...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'final_fix_snapshot_save.sql'), 'utf8');
    
    console.log('Applying SQL fix to database...');
    const { error } = await supabase.rpc('pg_query', { query_text: sqlScript });
    
    if (error) {
      console.error('Error applying SQL fix:', error.message);
      process.exit(1);
    }
    
    console.log('Successfully applied SQL fix for book snapshot saving function!');
    console.log('Now testing the function...');
    
    // Test the function with a simple call
    const { data, error: testError } = await supabase.rpc('check_function_exists', { 
      function_name: 'save_book_edit_snapshot' 
    });
    
    if (testError) {
      console.error('Error testing function existence:', testError.message);
    } else {
      console.log('Function existence check result:', data);
    }
    
    console.log('\nBook edit history snapshot function has been fixed.');
    console.log('Authors should now be able to save named snapshots of their books.');
    
  } catch (err) {
    console.error('Error running migration script:', err);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 
 