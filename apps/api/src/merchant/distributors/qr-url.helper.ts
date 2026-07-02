import { BindType } from '@prisma/client';

export function buildBindQrUrl(
  bindType: BindType,
  tenantSlug: string,
  token: string,
  merchantAppUrl: string,
  storeAppUrl: string,
): string {
  return bindType === BindType.CUSTOMER
    ? `${storeAppUrl}/s/${tenantSlug}/bind/${token}`
    : `${merchantAppUrl}/bind/${token}`;
}
