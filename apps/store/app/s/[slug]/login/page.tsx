'use client';

/**
 * 商店消费者登录页面
 *
 * 功能说明:
 * - 提供商店消费者的登录入口
 * - 使用邮箱+密码进行身份认证
 * - 登录成功后设置认证 cookie 并跳转
 *
 * 使用场景:
 * - 消费者访问商店受保护页面时重定向到此
 * - 登录成功后跳转到原始请求页面或商店首页
 * - 未注册用户可跳转至注册页面
 *
 * 认证说明:
 * - 使用 JWT Bearer Token 认证
 * - 登录成功后 token 存入 cookie（7天有效期）
 * - Cookie 名称: store_token
 * - 商店消费者 JWT 使用 JWT_STORE_SECRET 签名
 *
 * 页面布局:
 * - AuthToolbar: 顶部工具栏（显示商店标识）
 * - AuthLayout: 认证表单布局
 *
 * 表单字段:
 * - email: 消费者邮箱（必填）
 * - password: 登录密码（必填）
 *
 * 错误处理:
 * - API 返回非 200 时显示错误消息
 * - 网络错误显示通用失败消息
 */
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';

import { API_URL, AUTH_COOKIE, type AuthResponse } from '@/lib/api';

/**
 * 登录表单组件
 *
 * 核心功能:
 * 1. 表单输入管理
 *    - email: 邮箱地址
 *    - password: 登录密码
 *
 * 2. 登录流程
 *    - 提交表单到 /api/v1/store/{slug}/auth/login
 *    - 成功时将 token 存入 cookie
 *    - 跳转到原始请求页面或商店首页
 *
 * 3. 错误处理
 *    - API 返回非 200 时显示错误消息
 *    - 网络错误或解析错误显示通用失败消息
 *
 * 4. 加载状态
 *    - 提交过程中禁用按钮防止重复提交
 */
function LoginForm() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const t = useTranslations('store');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/store/${slug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('login.invalidCredentials'));
      }

      const data = (await res.json()) as AuthResponse;
      document.cookie = `${AUTH_COOKIE}=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const from = searchParams.get('from') ?? `/s/${slug}`;
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccountPrompt')}{' '}
          <Link href={`/s/${slug}/register`} className="text-primary hover:underline">
            {t('login.noAccount')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('login.password')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}

/**
 * 登录页面主组件
 *
 * 渲染流程:
 * 1. 渲染 AuthToolbar（顶部工具栏）
 * 2. 渲染 Suspense 边界（处理 LoginForm 可能的加载状态）
 * 3. 渲染 LoginForm 组件（实际的登录表单）
 */
export default function LoginPage() {
  return (
    <>
      <AuthToolbar portal="store" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
