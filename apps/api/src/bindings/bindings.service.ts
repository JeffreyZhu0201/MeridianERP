/**
 * Handles distributor binding verification and claims.
 * Binding records support CRM attribution; commission attribution still depends on
 * `MerchantProfile.recruitedByDistributorId`.
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

@Injectable()
export class BindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /** Read-only token precheck; does not create binding records. */
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
   * Merchant bind claim. Binding records support CRM attribution only;
   * commission attribution still depends on MerchantProfile.recruitedByDistributorId.
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

  /** Customer bind claim; re-binding the same distributor is idempotent. */
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

  /** Validates token and throws on failure (used by claim flows). */
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

  /** Ensures the customer cart is linked to the bound distributor. */
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

  /** Sends binding email when tenantSettings.notifyOnBinding is not false. */
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
