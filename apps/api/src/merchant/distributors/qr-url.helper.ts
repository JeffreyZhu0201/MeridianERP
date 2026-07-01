import { BindType } from '@prisma/client';

/**
 * 构建经销商绑定二维码 URL
 *
 * 根据绑定类型生成对应的绑定跳转 URL：
 * - CUSTOMER: 跳转至商店前端 /s/{tenantSlug}/bind/{token}
 * - MERCHANT: 跳转至商户前端 /bind/{token}
 *
 * @param bindType 绑定类型（商户或消费者）
 * @param tenantSlug 商户租户 slug
 * @param token 绑定令牌（JWT）
 * @param merchantAppUrl 商户前端地址
 * @param storeAppUrl 商店前端地址
 * @returns 完整的绑定跳转 URL
 */
export function buildBindQrUrl(
  bindType: BindType,
  tenantSlug: string,
  token: string,
  merchantAppUrl: string,
  storeAppUrl: string,
): string {
  return bindType === BindType.CUSTOMER
    ? `${storeAppUrl}/s/${tenantSlug}/bind/${token}`
    : `${merchantAppUrl}/bind/${token}`;
}
