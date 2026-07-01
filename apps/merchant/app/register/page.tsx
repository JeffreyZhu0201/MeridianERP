/**
 * 商户注册页面
 *
 * 功能说明:
 * - 提供商户用户的注册入口
 * - 使用分步向导引导完成注册流程
 * - 注册成功后自动登录并跳转
 *
 * 使用场景:
 * - 新商户首次入驻平台时注册账号
 * - 通过注册向导完成企业信息填写
 * - 注册成功后跳转至商户仪表盘
 *
 * 页面布局:
 * - RegisterWizard: 分步注册向导组件
 * - 使用 Suspense 包裹处理加载状态
 *
 * 注册流程（由 RegisterWizard 控制）:
 * 1. 填写基本联系信息
 * 2. 填写企业信息
 * 3. 设置登录密码
 * 4. 提交审核
 */
import { Suspense } from 'react';

import { RegisterWizard } from './_components/register-wizard';

/**
 * 注册页面主组件
 *
 * 渲染流程:
 * 1. 渲染 Suspense 边界（处理 RegisterWizard 可能的加载状态）
 * 2. 渲染 RegisterWizard 组件（实际的分步注册向导）
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterWizard />
    </Suspense>
  );
}
