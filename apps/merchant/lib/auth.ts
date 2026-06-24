import { cookies } from 'next/headers';

import { MerchantRole } from '@meridian/shared';

import { AUTH_COOKIE } from './api';

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

interface MerchantJwtPayload {
  roles?: string[];
  role?: string;
}

/** Decode JWT payload for UI hints (not verified — API enforces auth). */
export function decodeMerchantToken(token: string): MerchantJwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as MerchantJwtPayload;
  } catch {
    return null;
  }
}

export function isMerchantOwner(token: string): boolean {
  const payload = decodeMerchantToken(token);
  const roles = payload?.roles ?? (payload?.role ? [payload.role] : []);
  return roles.includes(MerchantRole.MERCHANT_OWNER);
}
