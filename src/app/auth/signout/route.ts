import { createClient } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // Sign out the user - this clears the session
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' }, 
        { status: 500 }
      );
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Clear any auth cookies manually
    response.cookies.delete('supabase-auth-token');
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    // Clear all cookies that might contain auth data
    const cookiesToClear = [
      'supabase-auth-token',
      'sb-access-token', 
      'sb-refresh-token',
      'supabase.auth.token',
      'auth-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0), // Expire immediately
        path: '/'
      });
    });

    return response;
  } catch (error) {
    console.error('Unexpected error during signout:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 