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
  
  // Update last login timestamp
  await supabase.rpc('update_last_login', {
    user_id: session.user.id
  });
  
  // Get full user profile with role information
  const { data, error } = await supabase.rpc('get_user_profile', {
    user_id: session.user.id
  });
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  if (!data.success) {
    console.error('Profile fetch unsuccessful:', data.message);
    return null;
  }
  
  return {
    session,
    profile: data.profile
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