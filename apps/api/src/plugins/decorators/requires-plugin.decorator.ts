import { SetMetadata } from '@nestjs/common';
import type { MerchantPluginCode } from '@meridian/shared';

export const REQUIRES_PLUGIN_KEY = 'requiresPlugin';

export const RequiresPlugin = (code: MerchantPluginCode) =>
  SetMetadata(REQUIRES_PLUGIN_KEY, code);
