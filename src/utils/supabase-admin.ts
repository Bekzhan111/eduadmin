import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL не установлен');
}

if (!serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SERVICE_ROLE_KEY не установлен');
}

// Cache for book data to improve performance
const booksCache = new Map<string, {
  timestamp: number;
  data: any[];
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Создание административного клиента Supabase с правами SERVICE_ROLE
 * ВНИМАНИЕ: Используйте только для серверных операций или когда RLS блокирует доступ
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Отсутствуют переменные окружения для админ клиента');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Проверяет, нужно ли использовать административный клиент для данной роли
 */
export function shouldUseAdminClient(role?: string): boolean {
  // Временное решение: используем админ клиент для модераторов
  // чтобы обойти проблемы с RLS политиками
  return role === 'moderator';
}

/**
 * Получение книг с использованием правильного клиента в зависимости от роли
 */
export async function fetchBooksWithCorrectClient(
  role?: string,
  userId?: string,
  fallbackClient?: SupabaseClient
) {
  // Generate cache key based on role and userId
  const cacheKey = `books_${role || 'guest'}_${userId || 'anonymous'}`;
  
  // Check if we have valid cached data
  const cachedData = booksCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
    console.log('Using cached books data');
    return { data: cachedData.data, error: null };
  }
  
  const useAdmin = shouldUseAdminClient(role);
  let client;
  
  try {
    client = useAdmin ? createAdminClient() : fallbackClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return { data: null, error: { message: 'Failed to create database client. Check your connection.' } };
  }
  
  if (!client) {
    return { data: null, error: { message: 'No valid Supabase client available.' } };
  }
  
  // Implement retry logic for network errors
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      let query = client
        .from('books')
        .select(`
          id,
          base_url,
          title,
          description,
          grade_level,
          course,
          category,
          status,
          author_id,
          moderator_id,
          created_at,
          updated_at,
          price,
          cover_image,
          file_size,
          pages_count,
          language,
          isbn,
          publisher,
          publication_date,
          downloads_count
        `);

      // Применяем фильтры в зависимости от роли
      switch (role) {
        case 'author':
          query = query.eq('author_id', userId);
          break;
        case 'moderator':
          query = query.eq('status', 'Moderation');
          break;
        case 'school':
        case 'teacher':
        case 'student':
          query = query.eq('status', 'Active');
          break;
        case 'super_admin':
          // No filters for super admin
          break;
        default:
          query = query.eq('status', 'Active');
          break;
      }

      const result = await query.order('created_at', { ascending: false });
      
      // Cache the result if successful
      if (result.data && !result.error) {
        booksCache.set(cacheKey, {
          timestamp: Date.now(),
          data: result.data
        });
        console.log(`Cached ${result.data.length} books for ${role || 'guest'}`);
      }
      
      return result;
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts}/${maxAttempts} failed:`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempts < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempts - 1) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Return cached data if available, even if expired
        if (cachedData) {
          console.log('Using expired cached data after failed attempts');
          return { 
            data: cachedData.data, 
            error: { 
              message: 'Failed to fetch fresh data. Using cached data.',
              details: error instanceof Error ? error.message : String(error)
            } 
          };
        }
        
        return { 
          data: null, 
          error: { 
            message: 'Failed to fetch books after multiple attempts',
            details: error instanceof Error ? error.message : String(error)
          } 
        };
      }
    }
  }
  
  // This should never be reached due to the return in the last catch block
  return { data: null, error: { message: 'Unknown error occurred' } };
} 
