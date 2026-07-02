import { cookies } from 'next/headers';

import { cartSessionCookieName } from './cart-session.shared';
export async function getServerCartSession(storeSlug: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(cartSessionCookieName(storeSlug))?.value;
}
