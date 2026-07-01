/**
 * 绑定模块服务层 - BindingsService
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 业务背景
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 经销商绑定是 MeridianERP 多租户渠道体系的核心功能，用于建立：
 * 1. 经销商 ↔ 商户：渠道合作关系（CRM 线索追踪）
 * 2. 经销商 ↔ 消费者：消费者购物关联（购物车归属）
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 两种绑定发起方式
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 【平台发起】（Platform-Initiated）
 *   - 场景：平台管理员在审批商户时，直接指定招募经销商
 *   - 流程：PlatformMerchantsService.approve() → 设置 profile.recruitedByDistributorId
 *   - 特点：无需二维码，直接建立招募关系，影响佣金计算
 *
 * 【经销商发起】（Distributor-Initiated）
 *   - 场景：经销商通过商户后台生成绑定二维码，商户扫码确认
 *   - 流程：DistributorsService.generateQr() → BindingsService.verify() → claimMerchant()
 *   - 特点：通过二维码链接建立绑定关系，同时创建 CRM 线索记录
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 绑定状态与生命周期
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 【二维码生命周期 - DistributorQrCode】
 *   ┌─────────────┐    生成    ┌─────────────┐
 *   │  (不存在)    │ ─────────► │   ACTIVE    │ ◄── 有效状态，可使用
 *   └─────────────┘            └──────┬──────┘
 *                                    │
 *                      ┌─────────────┼─────────────┐
 *                      │             │             │
 *                   撤销          过期         使用
 *                      │             │             │
 *                      ▼             ▼             ▼
 *               ┌───────────┐ ┌───────────┐ ┌───────────┐
 *               │  REVOKED  │ │  EXPIRED  │ │ (已使用)   │
 *               └───────────┘ └───────────┘ └───────────┘
 *
 *   - ACTIVE: valid=true, revokedAt=null, expiresAt > now()
 *   - REVOKED: 经销商主动撤销，可生成新二维码替代
 *   - EXPIRED: 超过有效期，不可使用
 *
 * 【绑定生命周期 - Binding】
 *   绑定一旦创建即为永久状态（无撤销机制），记录绑定时间 boundAt
 *   @@unique([bindableType, bindableId]) 确保每个商户/消费者只能绑定一个经销商
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 绑定与佣金计算的关系（重要）
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 【重要区分】绑定系统与佣金系统是分离的！
 *
 *   绑定系统（Binding）：           佣金系统（Commission）：
 *   ├─ 用于 CRM 线索追踪            ├─ 用于财务佣金计算
 *   ├─ 绑定记录创建时生成线索        ├─ 订单履约时计算佣金
 *   └─ 影响：线索来源归因           └─ 影响：经销商收入
 *
 *   佣金计算依据的是 MerchantProfile.recruitedByDistributorId，而非 Binding 表！
 *
 *   流程差异：
 *   - 经销商发起绑定 → 创建 Binding + CRM 线索（佣金需另行配置）
 *   - 平台审批时指定招募 → 设置 recruitedByDistributorId（直接影响佣金）
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 二维码 Token 结构
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * JWT Payload 内容：
 * {
 *   distributorId: string,   // 发行二维码的经销商ID
 *   tenantId: string,        // 租户ID（用于校验）
 *   bindType: 'MERCHANT' | 'CUSTOMER',  // 绑定类型
 *   purpose: 'bind',          // 用途标识
 *   jti: string,              // 唯一ID，用于防重放
 *   exp: number,              // 过期时间戳
 * }
 *
 * 验证方式：JWT 签名验证 + 数据库记录校验（防止撤销后使用）
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * BindType 绑定类型说明
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - MERCHANT（商户绑定）：
 *   用于商户与经销商建立渠道合作关系
 *   场景：经销商招募商户成为合作伙伴
 *   后续：创建 CRM 线索，便于经销商跟进
 *
 * - CUSTOMER（消费者绑定）：
 *   用于消费者与经销商建立购物关联
 *   场景：消费者扫描二维码后购物车自动关联该经销商
 *   后续：购物时可享受经销商专属价格/促销
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BindType as PrismaBindType } from '@prisma/client';
import { BindType } from '@meridian/shared';
import type {
  BindVerifyResponse,
  BindingRecord,
  StoreClaimBindingResponse,
} from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../queue/email-queue.service';
import { ClaimBindingDto } from './dto/claim-binding.dto';

/**
 * 绑定服务 - BindingsService
 *
 * 核心业务逻辑：
 * - 验证经销商分发的绑定令牌（二维码）的有效性
 * - 处理商户和消费者的绑定认领流程
 * - 自动维护消费者购物车与经销商的关联
 * - 在绑定成功时触发邮件通知（可配置）
 *
 * @see 二维码生成：DistributorsService.generateQr()
 * @see 平台指定招募：PlatformMerchantsService.approve()
 */
@Injectable()
export class BindingsService {
  /**
   * 构造函数 - 注入所需依赖
   *
   * @param prisma - Prisma 数据库服务，用于数据持久化操作
   * @param jwt - JWT 服务，用于验证绑定令牌签名
   * @param env - 环境配置服务，用于获取绑定令牌密钥
   * @param emailQueue - 邮件队列服务，用于发送绑定通知邮件
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /**
   * 验证绑定令牌有效性 - verify()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 功能说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 在用户扫描二维码或点击绑定链接后，前端调用此接口进行预检。
   * 此为只读验证操作，不创建任何数据库记录。
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 验证流程（四层检查）
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   *  第一层：数据库存在性检查
   *  ├─ 查询 distributorQrCode.token = token
   *  └─ 不存在 → 返回 valid=false, error='Token invalid or expired'
   *
   *  第二层：撤销状态检查
   *  ├─ 检查 qr.revokedAt 是否为 null
   *  └─ 已撤销 → 返回 valid=false, error='This link has been replaced...'
   *
   *  第三层：过期时间检查
   *  ├─ 比较 qr.expiresAt 与当前时间
   *  └─ 已过期 → 返回 valid=false, error='Token invalid or expired'
   *
   *  第四层：JWT 签名验证
   *  ├─ 使用 BIND_TOKEN_SECRET 验证 JWT 签名
   *  └─ 签名无效 → 返回 valid=false, error='Token signature invalid'
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 消费者绑定的特殊处理
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 当 bindType = CUSTOMER 时，需要返回 tenantSlug 供前端跳转：
   * - 前端根据 tenantSlug 构建商店 URL 并引导用户登录/注册
   * - 消费者完成认证后再调用 claimCustomer() 完成绑定
   *
   * @param token - 待验证的绑定令牌（二维码/链接中的 JWT token）
   * @returns 返回验证结果对象 BindVerifyResponse：
   *   - valid: 令牌是否有效
   *   - error: 无效时的错误信息（供前端展示）
   *   - distributorId: 经销商ID（有效时返回）
   *   - distributorName: 经销商名称（有效时返回）
   *   - bindType: 绑定类型 BindType.MERCHANT | BindType.CUSTOMER
   *   - expiresAt: 过期时间 ISO 字符串
   *   - requiresAuth: 是否需要登录认证
   *     * 商户绑定：通常已登录，可能为 false
   *     * 消费者绑定：始终为 true
   *   - tenantSlug: 租户别名（仅消费者绑定且租户有 slug 时返回）
   *
   * @example
   * // 有效令牌返回示例
   * {
   *   valid: true,
   *   distributorId: "dist_xxx",
   *   distributorName: "华东区经销商张三",
   *   bindType: "MERCHANT",
   *   expiresAt: "2026-07-07T00:00:00.000Z",
   *   requiresAuth: false,
   * }
   */
  async verify(token: string): Promise<BindVerifyResponse> {
    // 查询二维码记录，关联查询经销商信息
    const qr = await this.prisma.distributorQrCode.findUnique({
      where: { token },
      include: { distributor: true },
    });

    // 检查1：二维码记录是否存在
    if (!qr) {
      return { valid: false, error: 'Token invalid or expired' };
    }

    // 检查2：二维码是否已被撤销
    if (qr.revokedAt) {
      return {
        valid: false,
        error:
          'This link has been replaced. Request a new code from your distributor.',
      };
    }

    // 检查3：二维码是否已过期
    if (qr.expiresAt < new Date()) {
      return { valid: false, error: 'Token invalid or expired' };
    }

    // 检查4：验证JWT签名
    try {
      this.jwt.verify(token, {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
      });
    } catch {
      return { valid: false, error: 'Token signature invalid' };
    }

    // 对于消费者绑定，获取租户slug用于前端跳转
    let tenantSlug: string | undefined;
    if (qr.bindType === PrismaBindType.CUSTOMER && qr.distributor.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: qr.distributor.tenantId },
      });
      tenantSlug = tenant?.slug;
    }

    // 返回验证成功结果
    return {
      valid: true,
      distributorId: qr.distributorId,
      distributorName: qr.distributor.name,
      bindType: qr.bindType as BindType,
      expiresAt: qr.expiresAt.toISOString(),
      requiresAuth: qr.bindType === PrismaBindType.CUSTOMER,
      tenantSlug,
    };
  }

  /**
   * 商户认领绑定 - claimMerchant()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 功能说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 商户用户在管理后台点击绑定链接后调用此接口，确认与经销商建立绑定关系。
   * 这是【经销商发起绑定】流程的最后一步。
   *
   * 一个商户只能绑定到一个经销商（@@unique 约束）。
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 完整业务流程
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   *  1. [经销商] 商户后台 → 经销商管理 → 生成绑定二维码
   *     └─→ DistributorsService.generateQr() 创建 DistributorQrCode 记录
   *
   *  2. [商户管理员] 扫描二维码 → GET /bindings/verify/:token
   *     └─→ 验证二维码有效性，返回经销商信息
   *
   *  3. [商户管理员] 确认绑定 → POST /bindings/claim
   *     └─→ 本方法创建 Binding 记录 + CRM 线索 + 发送通知邮件
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 业务规则检查
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 检查项                          │ 失败处理
   * ────────────────────────────────┼─────────────────────────────
   * 令牌对应的二维码存在             │ BadRequestException
   * 二维码未被撤销                   │ BadRequestException
   * 二维码未过期                     │ BadRequestException
   * JWT 签名有效                     │ BadRequestException
   * 令牌类型为 MERCHANT             │ BadRequestException (提示用错链接)
   * 经销商与商户同租户               │ BadRequestException
   * 商户未绑定其他经销商             │ ConflictException
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 副作用说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 1. 创建 Binding 记录
   *    - 建立商户(tenant)与经销商的永久绑定关系
   *    - 用于 CRM 线索追踪（与佣金计算无关！）
   *
   * 2. 创建 CRM 线索（CrmLead）
   *    - title: "Distributor bind: {distributorId}"
   *    - source: "DISTRIBUTOR_QR"
   *    - stage: "NEW"
   *    - 便于经销商在 CRM 系统中跟进该商户
   *
   * 3. 发送邮件通知（可选）
   *    - 受 tenantSettings.notifyOnBinding 控制
   *    - 通知商户绑定成功
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 与佣金计算的关系（重要提示）
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 本方法创建的 Binding 记录【不】影响佣金计算！
   *
   * 佣金计算依据的是 MerchantProfile.recruitedByDistributorId（由平台管理员在审批时设置）。
   *
   * 如果需要让该绑定同时影响佣金，需要：
   * 1. 平台管理员手动在商户资料中设置 recruitedByDistributorId
   * 2. 或在商户审批流程中关联邀请码（pendingRecruitInviteCode）
   *
   * @param tenantId - 商户租户ID（从当前用户会话的 JWT 获取）
   * @param dto - 认领绑定请求 DTO，包含绑定令牌 token
   * @returns 返回格式化后的绑定记录 BindingRecord
   * @throws BadRequestException - 令牌无效、类型不匹配或租户不一致
   * @throws ConflictException - 商户已绑定其他经销商
   */
  async claimMerchant(tenantId: string, dto: ClaimBindingDto) {
    // 验证绑定令牌
    const qr = await this.validateBindToken(dto.token);

    // 确保令牌类型为商户绑定
    if (qr.bindType !== PrismaBindType.MERCHANT) {
      throw new BadRequestException(
        'This link is for customers. Use the store app to bind.',
      );
    }

    // 确保经销商与商户属于同一租户
    if (qr.distributor.tenantId !== tenantId) {
      throw new BadRequestException('Distributor not in your tenant');
    }

    // 检查是否已存在绑定关系
    const existing = await this.prisma.binding.findUnique({
      where: {
        bindableType_bindableId: {
          bindableType: PrismaBindType.MERCHANT,
          bindableId: tenantId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Already bound');
    }

    // 创建绑定记录
    const binding = await this.prisma.binding.create({
      data: {
        tenantId,
        distributorId: qr.distributorId,
        bindableType: PrismaBindType.MERCHANT,
        bindableId: tenantId,
      },
    });

    // 创建CRM线索记录，便于后续跟进的
    await this.prisma.crmLead.create({
      data: {
        tenantId,
        title: `Distributor bind: ${qr.distributorId}`,
        source: 'DISTRIBUTOR_QR',
        distributorId: qr.distributorId,
        stage: 'NEW',
      },
    });

    // 发送绑定成功通知邮件
    await this.notifyBindingCreatedIfEnabled(
      tenantId,
      qr.distributorId,
      binding.bindableType,
      binding.boundAt,
    );

    return this.formatBinding(binding);
  }

  /**
   * 消费者认领绑定 - claimCustomer()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 功能说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 消费者在商店前端扫描经销商二维码后，登录并调用此接口完成绑定。
   * 绑定后，消费者购物车自动关联该经销商，后续购物可享受专属权益。
   *
   * 与商户绑定的关键区别：
   * - 商户绑定：一个商户只能绑定一个经销商（独占性）
   * - 消费者绑定：可重新绑定新经销商（会替换原绑定和购物车关联）
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 完整业务流程
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   *  1. [经销商] 商户后台 → 经销商管理 → 生成消费者绑定二维码
   *     └─→ DistributorsService.generateQr(bindType=CUSTOMER)
   *
   *  2. [消费者] 扫描二维码 → GET /store/:slug/bind/verify/:token
   *     └─→ 验证二维码有效性，返回经销商信息
   *
   *  3. [消费者] 登录商店 → POST /store/:slug/bind/claim
   *     └─→ 本方法创建/更新 Binding + 关联购物车
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 业务规则检查
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 检查项                          │ 失败处理
   * ────────────────────────────────┼─────────────────────────────
   * 令牌对应的二维码存在             │ BadRequestException
   * 二维码未被撤销                   │ BadRequestException
   * 二维码未过期                     │ BadRequestException
   * JWT 签名有效                     │ BadRequestException
   * 令牌类型为 CUSTOMER             │ BadRequestException (提示用错链接)
   * 经销商与消费者同租户             │ BadRequestException
   * 消费者未绑定其他经销商           │ ConflictException（已绑定其他经销商）
   *                                   │ 但可重新绑定同一经销商（idempotent）
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 已存在绑定的处理逻辑
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 如果消费者已绑定到同一经销商（isExisting=true）：
   *   - 不创建新 Binding 记录（保持原记录不变）
   *   - 确保购物车关联到该经销商
   *   - 返回原绑定记录和购物车信息
   *   - 这是幂等操作，可安全重试
   *
   * 如果消费者已绑定到其他经销商（isExisting=false 但有绑定）：
   *   - 抛出 ConflictException
   *   - 提示用户需先解除原绑定
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 购物车关联机制
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 消费者绑定经销商的核心目的：购物车归属
   *
   * ensureCartDistributor() 处理逻辑：
   * ┌─────────────────────────────────────────────────────────────┐
   * │ 场景                          │ 操作                        │
   * ├───────────────────────────────┼────────────────────────────┤
   * │ 无购物车                      │ 创建新购物车，关联经销商    │
   * │ 有购物车，无经销商关联         │ 更新 distributorId         │
   * │ 有购物车，关联其他经销商       │ 更新 distributorId         │
   * │ 有购物车，已关联同经销商       │ 保持不变                   │
   * └───────────────────────────────┴────────────────────────────┘
   *
   * 购物车关联影响：
   * - 订单创建时自动携带 distributorId
   * - 可用于订单归因和佣金追踪
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * @param tenantId - 消费者所属租户ID
   * @param customerId - 消费者用户ID（从当前用户会话获取）
   * @param token - 绑定令牌（二维码/链接中的 JWT）
   * @returns 返回 StoreClaimBindingResponse & { isExisting: boolean }：
   *   - binding: 格式化后的绑定记录
   *   - distributor: 经销商基本信息 { id, name }
   *   - cart: 消费者购物车信息 { id, distributorId }
   *   - isExisting: 是否为已存在的绑定（true=幂等，false=新建）
   * @throws BadRequestException - 令牌无效、类型不匹配或租户不一致
   * @throws ConflictException - 消费者已绑定到其他经销商
   */
  async claimCustomer(
    tenantId: string,
    customerId: string,
    token: string,
  ): Promise<StoreClaimBindingResponse & { isExisting: boolean }> {
    // 验证绑定令牌
    const qr = await this.validateBindToken(token);

    // 确保令牌类型为消费者绑定
    if (qr.bindType !== PrismaBindType.CUSTOMER) {
      throw new BadRequestException(
        'This link is for merchant partners, not customers',
      );
    }

    // 确保经销商与消费者属于同一租户
    if (qr.distributor.tenantId !== tenantId) {
      throw new BadRequestException('Distributor not in your tenant');
    }

    // 查询现有绑定记录
    const existing = await this.prisma.binding.findUnique({
      where: {
        bindableType_bindableId: {
          bindableType: PrismaBindType.CUSTOMER,
          bindableId: customerId,
        },
      },
    });

    // 处理已存在绑定的情况
    if (existing) {
      // 已绑定到其他经销商，抛出冲突异常
      if (existing.distributorId !== qr.distributorId) {
        throw new ConflictException(
          'You are already bound to another distributor',
        );
      }
      // 已绑定到同一经销商，确保购物车关联并返回
      const cart = await this.ensureCartDistributor(
        tenantId,
        customerId,
        qr.distributorId,
      );
      return {
        binding: this.formatBinding(existing),
        distributor: { id: qr.distributor.id, name: qr.distributor.name },
        cart: { id: cart.id, distributorId: cart.distributorId! },
        isExisting: true,
      };
    }

    // 创建新绑定记录
    const binding = await this.prisma.binding.create({
      data: {
        tenantId,
        distributorId: qr.distributorId,
        bindableType: PrismaBindType.CUSTOMER,
        bindableId: customerId,
      },
    });

    // 确保购物车关联到该经销商
    const cart = await this.ensureCartDistributor(
      tenantId,
      customerId,
      qr.distributorId,
    );

    // 发送绑定成功通知邮件
    await this.notifyBindingCreatedIfEnabled(
      tenantId,
      qr.distributorId,
      binding.bindableType,
      binding.boundAt,
    );

    return {
      binding: this.formatBinding(binding),
      distributor: { id: qr.distributor.id, name: qr.distributor.name },
      cart: { id: cart.id, distributorId: cart.distributorId! },
      isExisting: false,
    };
  }

  /**
   * 验证绑定令牌（内部方法）- validateBindToken()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 用途说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 这是 verify() 的内部实现版本，与 verify() 的区别：
   *
   *   verify()              │ validateBindToken()
   *   ──────────────────────┼────────────────────────
   *   返回错误对象           │ 抛出异常
   *   用于预览验证           │ 用于需要中断流程的场景
   *   返回 Promise<结果>     │ 验证失败直接抛异常
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 验证内容（四层检查）
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 与 verify() 完全一致：
   * 1. 二维码记录存在性 → qr !== null
   * 2. 撤销状态 → qr.revokedAt === null
   * 3. 过期时间 → qr.expiresAt > now()
   * 4. JWT 签名 → jwt.verify(token, { secret })
   *
   * @param token - 待验证的绑定令牌（JWT 格式）
   * @returns 返回验证通过的二维码记录（含关联的 distributor 信息）
   * @throws BadRequestException - 任一验证失败时抛出具体错误
   */
  private async validateBindToken(token: string) {
    // 查询二维码记录
    const qr = await this.prisma.distributorQrCode.findUnique({
      where: { token },
      include: { distributor: true },
    });

    // 检查记录存在性
    if (!qr) {
      throw new BadRequestException('Token invalid or expired');
    }

    // 检查撤销状态
    if (qr.revokedAt) {
      throw new BadRequestException(
        'This link has been replaced. Request a new code from your distributor.',
      );
    }

    // 检查过期时间
    if (qr.expiresAt < new Date()) {
      throw new BadRequestException('Token invalid or expired');
    }

    // 验证JWT签名
    try {
      this.jwt.verify(token, {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token signature invalid');
    }

    return qr;
  }

  /**
   * 确保消费者购物车关联到指定经销商 - ensureCartDistributor()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 用途说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 消费者绑定经销商后，其购物车必须关联该经销商。
   * 此方法确保购物车始终与当前绑定经销商保持一致。
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 购物车与经销商的关系
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 购物车关联经销商的作用：
   * 1. 订单归因：订单自动携带 distributorId，便于统计
   * 2. 佣金追踪：虽然佣金基于 recruitedByDistributorId，但订单级归因有助于分析
   * 3. 专属价格：可能影响商品价格展示（视业务规则而定）
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 场景处理矩阵
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * ┌────────────────────────────────────────────────────────────────────────┐
   * │ 场景                          │ cart.distributorId    │ 操作           │
   * ├───────────────────────────────┼───────────────────────┼────────────────┤
   * │ 无购物车                      │ null                  │ CREATE 新购物车 │
   * │ 有购物车，未关联任何经销商     │ null                  │ UPDATE 关联     │
   * │ 有购物车，关联其他经销商       │ distributorId ≠ param │ UPDATE 替换     │
   * │ 有购物车，已关联目标经销商     │ distributorId = param │ 保持不变       │
   * └───────────────────────────────┴───────────────────────┴────────────────┘
   *
   * @param tenantId - 租户ID
   * @param customerId - 消费者ID
   * @param distributorId - 要关联的经销商ID
   * @returns 返回购物车记录（含关联的 distributorId）
   */
  private async ensureCartDistributor(
    tenantId: string,
    customerId: string,
    distributorId: string,
  ) {
    // 查找消费者现有购物车
    let cart = await this.prisma.cart.findFirst({
      where: { tenantId, customerId },
    });

    // 无购物车则创建
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { tenantId, customerId, distributorId },
      });
    }
    // 有购物车但关联了不同经销商，更新关联
    else if (cart.distributorId !== distributorId) {
      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { distributorId },
      });
    }

    return cart;
  }

  /**
   * 触发绑定创建邮件通知（条件执行）- notifyBindingCreatedIfEnabled()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 用途说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 绑定成功后，根据租户设置决定是否发送邮件通知。
   * 这是【可选功能】，由 tenantSettings.notifyOnBinding 控制。
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 通知决策逻辑
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   *   tenantSettings.notifyOnBinding
   *   │
   *   ├─ undefined / null / true  →  发送邮件
   *   │
   *   └─ false                    →  跳过，不发送
   *
   * 注意：默认值是【发送】（undefined 视为 true）
   * 这是有意设计的，绑定是重要业务事件，默认通知可避免遗漏
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 邮件内容
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 通过 EmailQueueService.sendBindingCreated() 发送，邮件包含：
   * - 绑定类型（MERCHANT / CUSTOMER）
   * - 经销商名称
   * - 绑定时间
   * - 租户信息
   *
   * @param tenantId - 租户ID（用于查询租户设置）
   * @param distributorId - 经销商ID（邮件内容）
   * @param bindType - 绑定类型（邮件内容）
   * @param boundAt - 绑定时间（邮件内容）
   */
  private async notifyBindingCreatedIfEnabled(
    tenantId: string,
    distributorId: string,
    bindType: PrismaBindType,
    boundAt: Date,
  ): Promise<void> {
    // 查询租户设置
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    // 检查是否启用通知（默认为启用）
    if (settings?.notifyOnBinding === false) {
      return;
    }

    // 发送绑定创建邮件
    await this.emailQueue.sendBindingCreated({
      tenantId,
      distributorId,
      bindType,
      boundAt: boundAt.toISOString(),
    });
  }

  /**
   * 格式化绑定记录为 API 响应格式 - formatBinding()
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 用途说明
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * 将 Prisma 返回的数据库记录转换为对外 API 的标准响应格式。
   *
   * 主要转换：Date 对象 → ISO 8601 字符串
   * 这是必须的，因为 JSON API 无法直接传输 Date 对象。
   *
   * ═══════════════════════════════════════════════════════════════════════════════
   * 转换对照表
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   *   数据库字段         │ 类型        │ API 响应字段  │ 类型
   *   ───────────────────┼─────────────┼──────────────┼─────────────
   *   id                │ String      │ id           │ String
   *   tenantId          │ String      │ tenantId     │ String
   *   distributorId     │ String      │ distributorId│ String
   *   bindableType      │ BindType    │ bindableType│ BindType
   *   bindableId        │ String      │ bindableId   │ String
   *   boundAt           │ Date        │ boundAt      │ String (ISO)
   *
   * @param binding - 数据库中的绑定记录（Prisma 原始记录）
   * @returns 格式化后的绑定记录，符合 BindingRecord 类型定义
   */
  private formatBinding(binding: {
    id: string;
    tenantId: string;
    distributorId: string;
    bindableType: PrismaBindType;
    bindableId: string;
    boundAt: Date;
  }): BindingRecord {
    return {
      id: binding.id,
      tenantId: binding.tenantId,
      distributorId: binding.distributorId,
      bindableType: binding.bindableType as BindType,
      bindableId: binding.bindableId,
      boundAt: binding.boundAt.toISOString(),
    };
  }
}
