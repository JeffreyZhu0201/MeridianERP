'use client';

/**
 * 商店消费者注册页面
 *
 * 功能说明:
 * - 提供商店消费者的注册入口
 * - 使用邮箱+密码进行注册
 * - 注册成功后自动登录并跳转
 *
 * 使用场景:
 * - 新消费者首次访问商店时注册账号
 * - 注册成功后跳转至商店首页
 * - 已注册用户可跳转至登录页面
 *
 * 认证说明:
 * - 使用 JWT Bearer Token 认证
 * - 注册成功后自动登录，token 存入 cookie（7天有效期）
 * - Cookie 名称: store_token
 * - 商店消费者 JWT 使用 JWT_STORE_SECRET 签名
 *
 * 页面布局:
 * - AuthToolbar: 顶部工具栏（显示商店标识）
 * - AuthLayout: 认证表单布局
 *
 * 表单字段:
 * - email: 消费者邮箱（必填）
 * - password: 密码（必填，最少8字符）
 *
 * 错误处理:
 * - API 返回非 200 时显示错误消息
 * - 网络错误显示通用失败消息
 */
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AuthLayout, AuthToolbar, Button, Input, Label } from '@meridian/ui';

import { API_URL, AUTH_COOKIE, type AuthResponse } from '@/lib/api';

/**
 * 注册页面主组件
 *
 * 核心功能:
 * 1. 表单输入管理
 *    - email: 邮箱地址
 *    - password: 密码（最少8字符）
 *
 * 2. 注册流程
 *    - 提交表单到 /api/v1/store/{slug}/auth/register
 *    - 成功时自动登录并跳转至商店首页
 *    - 失败时显示错误消息
 *
 * 3. 错误处理
 *    - API 返回非 200 时显示错误消息
 *    - 网络错误或解析错误显示通用失败消息
 *
 * 4. 加载状态
 *    - 提交过程中禁用按钮防止重复提交
 */
export default function RegisterPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
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
      const res = await fetch(`${API_URL}/api/v1/store/${slug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? t('register.failed'));
      }

      const data = (await res.json()) as AuthResponse;
      document.cookie = `${AUTH_COOKIE}=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.push(`/s/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthToolbar portal="store" />
      <AuthLayout
        subtitle={t('register.subtitle')}
        footer={
          <>
            {t('register.hasAccountPrompt')}{' '}
            <Link href={`/s/${slug}/login`} className="text-primary hover:underline">
              {t('register.signInLink')}
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('register.email')}</Label>
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
            <Label htmlFor="password">{t('register.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('register.submitting') : t('register.submit')}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}
