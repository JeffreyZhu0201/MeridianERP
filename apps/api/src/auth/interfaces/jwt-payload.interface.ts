export interface JwtPayload {
  sub: string;
  aud: 'admin' | 'merchant' | 'store' | 'distributor';
  tenantId?: string;
  roles: string[];
}

export interface AuthenticatedUser {
  userId: string;
  aud: JwtPayload['aud'];
  tenantId?: string;
  roles: string[];
}
