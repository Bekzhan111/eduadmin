import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type CookieOptions } from '@supabase/ssr';

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(_name: string, _value: string, _options: CookieOptions) {
          // Next.js cookies() doesn't support setting cookies in middleware
          // This is handled by the Supabase client on the client side
        },
        async remove(_name: string, _options: CookieOptions) {
          // Next.js cookies() doesn't support removing cookies in middleware
          // This is handled by the Supabase client on the client side
        },
      },
    }
  );
}; 