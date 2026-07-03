import { cookies } from 'next/headers';

import { apiFetch, AUTH_COOKIE, type AdminSession } from './api';

export { ADMIN_ROLE_COOKIE } from './api';

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    return await apiFetch<AdminSession>('/platform/auth/me', {}, token);
  } catch {
    return null;
  }
}
