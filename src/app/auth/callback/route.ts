import { createClient } from '@/utils/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth callback error:', error);
      // Redirect to login with error message
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login`);
} 