import { cartSessionStorageKey } from '@meridian/shared';
import { cookies } from 'next/headers';

const COOKIE_PREFIX = 'meridian_cart_session_';

export function cartSessionCookieName(storeSlug: string): string {
  return `${COOKIE_PREFIX}${storeSlug}`;
}

/** Client: get or create cart session and sync to cookie for SSR. */
export function ensureCartSessionId(storeSlug: string): string {
  const storageKey = cartSessionStorageKey(storeSlug);
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  document.cookie = `${cartSessionCookieName(storeSlug)}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  return id;
}

/** Server: read guest cart session from cookie. */
export async function getServerCartSession(storeSlug: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(cartSessionCookieName(storeSlug))?.value;
}
