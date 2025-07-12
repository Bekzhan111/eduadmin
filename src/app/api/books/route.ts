import { NextRequest, NextResponse } from 'next/server';
import { fetchBooksWithCorrectClient, clearBooksCache } from '@/utils/supabase-admin';
import { createClient } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const clearCache = searchParams.get('clearCache');

    if (clearCache === 'true') {
      clearBooksCache();
      console.log('Books cache cleared');
    }

    console.log('Books API called with:', { role, userId, clearCache });

    // Create a fallback client for non-admin operations
    const fallbackClient = createClient();

    const result = await fetchBooksWithCorrectClient(
      role || undefined,
      userId || undefined,
      fallbackClient
    );

    if (result.error) {
      console.error('Books fetch error:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });

  } catch (error) {
    console.error('Books API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}