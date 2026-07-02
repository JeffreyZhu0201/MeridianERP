import { cartSessionStorageKey } from '@meridian/shared';

import { cartSessionCookieName } from './cart-session.shared';
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
