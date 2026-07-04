import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_ROLE_COOKIE, AUTH_COOKIE } from '@/lib/api';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  cookieStore.delete(ADMIN_ROLE_COOKIE);
  redirect('/login');
}
