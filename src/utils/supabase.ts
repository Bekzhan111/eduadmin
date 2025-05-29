import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if the environment variables are set
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are missing');
    
    // Provide a clear error message but still return a client that will fail gracefully
    if (!supabaseUrl && !supabaseKey) {
      console.error('Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing');
    } else if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is missing');
    } else {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    }
  }
  
  return createBrowserClient(supabaseUrl || '', supabaseKey || '');
};

// Function to check database connectivity
export const checkDatabaseConnection = async () => {
  try {
    const supabase = createClient();
    
    // Use a system function that doesn't require table access
    const { data, error } = await supabase.rpc('check_connection');
    
    if (error) {
      return {
        connected: false,
        error: error
      };
    }
    
    return {
      connected: true,
      data
    };
  } catch (error) {
    return {
      connected: false,
      error
    };
  }
}; 