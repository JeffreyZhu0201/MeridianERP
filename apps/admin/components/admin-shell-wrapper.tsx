/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-25 20:56:10
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-02 15:03:20
 * @FilePath: /MeridianERP/apps/admin/components/admin-shell-wrapper.tsx
 * @Description: AdminShellWrapper is the wrapper for the admin shell
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
'use client';

import { useRouter } from 'next/navigation';

import { AdminShell } from '@meridian/ui';

import { AUTH_COOKIE } from '@/lib/api';

/**
 * @description: AdminShellWrapper is the wrapper for the admin shell
 * @param {React.ReactNode} children
 * @param {string} userEmail
 * @return {React.ReactNode}
 */
export function AdminShellWrapper({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    router.push('/login');
    router.refresh();
  }

  return (
    <AdminShell userEmail={userEmail} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
