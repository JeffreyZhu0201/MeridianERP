'use client';

/**
 * 经销商登录页面
 *
 * 功能说明:
 * - 提供经销商用户的登录入口
 * - 支持邮箱+密码+商户 slug 登录
 * - 登录成功后设置认证 cookie 并跳转
 *
 * 使用场景:
 * - 经销商用户访问受保护页面时重定向到此
 * - 登录成功后跳转到原始请求页面（from 参数）
 *
 * 认证说明:
 * - 使用 JWT Bearer Token 认证
 * - 登录成功后 token 存入 cookie（7天有效期）
 * - Cookie 名称: distributor_token
 *
 * 表单字段:
 * - email: 经销商邮箱（必填）
 * - password: 密码（必填）
 * - tenantSlug: 商户 slug（可选，用于指定登录的商户上下文）
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';

import { API_URL, AUTH_COOKIE, type DistributorLoginResponse } from '@/lib/api';

/**
 * 登录表单组件
 *
 * 核心功能:
 * 1. 表单输入管理
 *    - email: 邮箱地址
 *    - password: 登录密码
 *    - tenantSlug: 商户 slug（可选字段）
 *
 * 2. 登录流程
 *    - 提交表单到 /api/v1/distributor/auth/login
 *    - 成功时将 token 存入 cookie
 *    - 跳转到原始请求页面或首页
 *
 * 3. 错误处理
 *    - API 返回非 200 时显示错误消息
 *    - 网络错误或解析错误显示通用失败消息
 *
 * 4. 加载状态
 *    - 提交过程中禁用按钮防止重复提交
 */
function LoginForm() {
  const t = useTranslations('distributor.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/distributor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(tenantSlug.trim() ? { tenantSlug: tenantSlug.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('invalidCredentials'));
      }

      const data = (await res.json()) as DistributorLoginResponse;
      document.cookie = `${AUTH_COOKIE}=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const from = searchParams.get('from') ?? '/';
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signInFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthToolbar portal="distributor" />
      <AuthLayout subtitle={t('subtitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">{t('tenantSlug')}</Label>
            <Input
              id="tenantSlug"
              name="tenantSlug"
              type="text"
              autoComplete="organization"
              placeholder={t('tenantSlugPlaceholder')}
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('tenantSlugHint')}</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('submit')}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
