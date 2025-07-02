// Script to apply the book edit history migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read the migration file
const migrationFilePath = path.join(__dirname, 'supabase', 'migrations', '20250701000000_add_book_edit_history.sql');
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading migration file: ${error.message}`);
  process.exit(1);
}

// Function to execute the SQL migration
async function applyMigration() {
  console.log('Starting migration for book edit history...');
  
  try {
    // Execute SQL migration
    const { error } = await supabase.rpc('pgmigrations_execute', {
      sql: migrationSQL
    });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration applied successfully!');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Test the book edit history feature');
    console.log('3. Check for any errors in the console when saving books');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    
    console.log('\nAlternative approach:');
    console.log('1. Log in to the Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Run the SQL commands from the migration file manually');
    console.log(`Migration file: ${migrationFilePath}`);
  }
}

// Run the migration
applyMigration(); 
