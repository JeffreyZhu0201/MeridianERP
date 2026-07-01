/**
 * 管理门户登录页面
 *
 * 功能说明:
 * - 提供平台管理员的登录入口
 * - 使用邮箱+密码进行身份认证
 * - 登录成功后设置认证 cookie 并跳转
 *
 * 使用场景:
 * - 平台管理员访问受保护页面时重定向到此
 * - 登录成功后跳转到原始请求页面（from 参数）
 *
 * 认证说明:
 * - 使用 JWT Bearer Token 认证
 * - 登录成功后 token 存入 cookie（7天有效期）
 * - Cookie 名称: admin_token
 * - 平台管理员 JWT 使用 JWT_SECRET 签名
 *
 * 页面布局:
 * - LoginForm 子组件负责渲染登录表单
 * - 使用 Suspense 包裹处理加载状态
 */
import { Suspense } from 'react';

import { LoginForm } from './_components/login-form';

/**
 * 登录页面主组件
 *
 * 渲染流程:
 * 1. 渲染 Suspense 边界（处理 LoginForm 可能的加载状态）
 * 2. 渲染 LoginForm 组件（实际的登录表单）
 *
 * 子组件 LoginForm 职责:
 * - 渲染登录表单（邮箱、密码输入框）
 * - 处理表单提交和错误显示
 * - 调用认证 API 并设置 cookie
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
