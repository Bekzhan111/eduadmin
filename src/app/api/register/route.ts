import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API /register called');
    
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      urlStart: supabaseUrl?.substring(0, 20) + '...',
      keyStart: serviceRoleKey?.substring(0, 10) + '...'
    });
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { registration_key, user_id, display_name } = body;

    // Validate required fields
    if (!registration_key || !user_id || !display_name) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import the registration helper here to avoid module loading issues
    const { registerUserWithKey } = await import('@/lib/registration-helper');
    
    console.log('🔄 Calling registration helper...');
    
    // Call the registration helper
    const result = await registerUserWithKey(registration_key, user_id, display_name);
    
    console.log('📊 Registration result:', result);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Registration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
} 