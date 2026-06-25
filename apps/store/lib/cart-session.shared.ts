const COOKIE_PREFIX = 'meridian_cart_session_';

export function cartSessionCookieName(storeSlug: string): string {
  return `${COOKIE_PREFIX}${storeSlug}`;
}
