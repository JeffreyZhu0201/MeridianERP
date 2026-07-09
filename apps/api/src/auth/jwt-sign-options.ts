import type { JwtSignOptions } from '@nestjs/jwt';

import type { EnvService } from '../config/env.service';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

const DEFAULT_JWT_EXPIRES_IN = '7d';

export function getJwtExpiresIn(env: EnvService): JwtExpiresIn {
  const raw =
    env.get('JWT_EXPIRES_IN', DEFAULT_JWT_EXPIRES_IN) ?? DEFAULT_JWT_EXPIRES_IN;
  return raw as JwtExpiresIn;
}

export function audienceJwtSignOptions(
  env: EnvService,
  secretEnvKey: string,
): JwtSignOptions {
  return {
    secret: env.getOrThrow(secretEnvKey),
    expiresIn: getJwtExpiresIn(env),
  };
}
