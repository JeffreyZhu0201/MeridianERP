import type { MerchantInstalledPluginsResponse, MerchantPluginCode } from '@meridian/shared';

import { apiFetch } from './api';
import { getToken } from './auth';

export async function getInstalledPluginCodes(): Promise<MerchantPluginCode[]> {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await apiFetch<MerchantInstalledPluginsResponse>(
      '/merchant/plugins/installed-codes',
      {},
      token,
    );
    return res.codes;
  } catch {
    return [];
  }
}

export async function requirePluginInstalled(code: MerchantPluginCode): Promise<boolean> {
  const codes = await getInstalledPluginCodes();
  return codes.includes(code);
}
