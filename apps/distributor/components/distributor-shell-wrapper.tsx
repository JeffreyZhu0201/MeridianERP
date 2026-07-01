/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-25 20:56:10
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-06-27 13:33:07
 * @FilePath: /MeridianERP/apps/distributor/components/distributor-shell-wrapper.tsx
 * @Description: 
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
'use client';

import { useRouter } from 'next/navigation';

import { DistributorShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

export function DistributorShellWrapper({
  children,
  distributorName,
}: {
  children: React.ReactNode;
  distributorName?: string;
}) {
  const router = useRouter();
  
  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  }

  return (
    <DistributorShell distributorName={distributorName} onLogout={handleLogout}>
      {children}
    </DistributorShell>
  );
}
