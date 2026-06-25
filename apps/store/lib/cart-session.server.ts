import { cookies } from 'next/headers';

import { cartSessionCookieName } from './cart-session.shared';

/** Server: read guest cart session from cookie. */
export async function getServerCartSession(storeSlug: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(cartSessionCookieName(storeSlug))?.value;
}
