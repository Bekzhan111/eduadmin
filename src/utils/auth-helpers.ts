import { createClient } from './supabase-server';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = createClient();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function getUserProfile() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }

  const supabase = createClient();
  
  // Get user profile data directly from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, email, display_name, school_id')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching user profile:', userError);
    return null;
  }

  // If user not found in users table but exists in auth
  if (!userData) {
    console.warn('User exists in auth but not in users table:', session.user.id);
    return null;
  }

  const userProfile = {
    id: session.user.id,
    role: userData.role || 'unknown',
    email: userData.email || session.user.email || '',
    display_name: userData.display_name || null,
    school_id: userData.school_id || null,
  };

  return {
    session,
    profile: userProfile
  };
}

export async function requireRole(allowedRoles: string[]) {
  const userInfo = await getUserProfile();
  
  if (!userInfo?.session) {
    redirect('/login');
  }
  
  const userRole = userInfo.profile?.role || '';
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized');
  }
  
  return userInfo;
}

export async function isFirstUser() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error checking first user:', error);
    return false;
  }
  
  return count === 0;
}

export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }
} 