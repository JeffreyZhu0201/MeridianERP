/**
 * Public token verification and merchant-side binding claim endpoints.
 * Customer binding uses store-specific endpoints because it has a separate auth realm.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../auth/guards/merchant-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { ClaimBindingDto } from './dto/claim-binding.dto';
import { BindingsService } from './bindings.service';

/**
 * 绑定控制器 - BindingsController
 *
 * 提供经销商绑定相关的 REST API 端点。
 * 负责处理 HTTP 请求的路由和数据转换。
 *
 * @see BindingsService 业务逻辑实现
 * @see BindingsModule 模块配置
 */
@Controller('bindings')
export class BindingsController {
  /**
   * 构造函数 - 注入绑定服务
   *
   * @param bindingsService - 绑定业务逻辑服务
   */
  constructor(private readonly bindingsService: BindingsService) {}

  /**
   * 验证绑定令牌 - verify()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 功能说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 这是一个公开接口，供前端在显示绑定确认页面之前验证令牌的有效性。
   *
   * 用户扫描二维码或点击绑定链接后，前端调用此接口获取：
   * - 令牌是否有效（valid）
   * - 经销商信息（名称）
   * - 绑定类型（商户/消费者）
   * - 过期时间
   * - 是否需要登录认证
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 典型使用场景
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 1. 商户 App 扫码
   *    └─→ 验证通过 → 展示绑定确认按钮
   *    └─→ 验证失败 → 展示错误信息
   *
   * 2. 商店 App 扫码
   *    └─→ 验证通过 → 跳转登录页（requiresAuth=true）
   *    └─→ 登录后 → 调用 claimCustomer 完成绑定
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 请求响应示例
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * GET /bindings/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *
   * // 成功响应
   * {
   *   "valid": true,
   *   "distributorId": "dist_xxx",
   *   "distributorName": "华东区经销商张三",
   *   "bindType": "MERCHANT",
   *   "expiresAt": "2026-07-07T00:00:00.000Z",
   *   "requiresAuth": false
   * }
   *
   * // 失败响应
   * {
   *   "valid": false,
   *   "error": "Token invalid or expired"
   * }
   *
   * @param token - URL 路径参数，二维码/链接中的绑定令牌（JWT）
   * @returns 返回验证结果对象 BindVerifyResponse
   */
  @Public()
  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.bindingsService.verify(token);
  }

  /**
   * 商户认领绑定 - claimMerchant()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 功能说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 已登录的商户通过此接口确认与经销商的绑定关系。
   *
   * 这是【经销商发起绑定】流程的最后一步：
   * 1. 经销商生成二维码 → 2. 商户扫码验证 → 3. 商户点击确认（调用本接口）
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 重要约束
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * - 只能由商户用户调用（需要 merchant_token）
   * - 消费者绑定需使用商店前端的专用接口
   * - 一个商户只能绑定到一个经销商
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 请求响应示例
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * POST /bindings/claim
   * Content-Type: application/json
   * Cookie: merchant_token=xxx
   *
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * // 成功响应 (201 Created)
   * {
   *   "id": "bind_xxx",
   *   "tenantId": "tenant_xxx",
   *   "distributorId": "dist_xxx",
   *   "bindableType": "MERCHANT",
   *   "bindableId": "tenant_xxx",
   *   "boundAt": "2026-06-30T12:00:00.000Z"
   * }
   *
   * @param user - 当前认证用户信息（从 JWT 会话提取，包含 tenantId）
   * @param dto - 请求体 ClaimBindingDto，包含绑定令牌
   * @returns 返回格式化后的绑定记录 BindingRecord
   */
  @UseGuards(MerchantAuthGuard)
  @Post('claim')
  @HttpCode(201)
  claimMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClaimBindingDto,
  ) {
    // 从用户会话获取租户ID，调用服务层处理绑定认领
    return this.bindingsService.claimMerchant(user.tenantId!, dto);
  }
}
