'use client';

import type { ReactNode } from 'react';

import { AuthLayout } from '../auth-layout';

export interface AuthStatusFrameProps {
  /** Portal label under MeridianERP brand */
  subtitle: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/** FW-AUTH-STATUS — login-03 canvas with centered status card (onboarding, landing). */
export function AuthStatusFrame({
  subtitle,
  title,
  description,
  children,
  footer,
}: AuthStatusFrameProps) {
  return (
    <AuthLayout subtitle={subtitle} footer={footer}>
      <div className="space-y-4 text-center">
        {children}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </AuthLayout>
  );
}
