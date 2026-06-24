import { cookies } from 'next/headers';

import { AUTH_COOKIE } from './api';

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}
