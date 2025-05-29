import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth-helpers';

// Mark this page as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
