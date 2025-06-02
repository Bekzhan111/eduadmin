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

// Utility function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, context = 'Database operation') => {
  if (!error) return null;
  
  console.error(`${context} error:`, error);
  
  // Network errors
  if (error.message?.includes('Load failed') || 
      error.message?.includes('fetch') || 
      error.message?.includes('NetworkError') ||
      error.name === 'NetworkError') {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  
  // Permission errors
  if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Generic database errors
  if (error.code) {
    return `Database error (${error.code}): ${error.message}`;
  }
  
  // Default fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Utility function to check if error is a network error
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  return errorMessage.includes('Load failed') || 
         errorMessage.includes('fetch') || 
         errorMessage.includes('NetworkError') ||
         errorMessage.includes('network') ||
         error.name === 'NetworkError';
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