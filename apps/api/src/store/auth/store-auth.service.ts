/**
 * StoreAuthService - 商店用户认证服务
 *
 * 负责商店消费者的用户认证功能，包括注册和登录。
 *
 * 核心功能：
 * 1. 注册：新消费者在特定商户商店注册账号
 * 2. 登录：验证消费者凭据并签发 JWT 令牌
 *
 * 认证机制：
 * - 使用 JWT_STORE_SECRET 签发 'store' 受众的令牌
 * - 令牌包含 customerId、tenantId 和 'CUSTOMER' 角色
 * - 密码使用 bcrypt 加密存储（盐值轮数 10）
 *
 * 多租户隔离：
 * - 每个商户商店（Tenant）有独立的消费者账户空间
 * - 通过 tenantId + email 的唯一组合确保邮箱在同商户内不重复
 *
 * @service StoreAuthService
 */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EnvService } from '../../config/env.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';

/**
 * 可注入的认证服务
 * 提供消费者注册和登录功能
 */
@Injectable()
export class StoreAuthService {
  /**
   * 构造函数 - 注入所需依赖
   * @param prisma - Prisma 数据库服务
   * @param jwt - JWT 签发服务
   * @param env - 环境变量服务（用于获取 JWT_SECRET）
   * @param storeTenant - 商店租户解析服务
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  /**
   * 签发商店用户 JWT 令牌
   *
   * @param customerId - 消费者用户 ID
   * @param tenantId - 商户租户 ID
   * @returns JWT 令牌字符串，包含 sub、aud、tenantId、roles 信息
   *
   * JWT 负载结构：
   * - sub: 消费者 ID
   * - aud: 'store'（固定值，表示商店消费者）
   * - tenantId: 商户 ID，用于数据隔离
   * - roles: ['CUSTOMER']，标识消费者角色
   */
  private signStoreToken(customerId: string, tenantId: string) {
    return this.jwt.sign(
      {
        sub: customerId,
        aud: 'store' as const,
        tenantId,
        roles: ['CUSTOMER'],
      },
      { secret: this.env.getOrThrow('JWT_STORE_SECRET') },
    );
  }

  /**
   * 注册新消费者
   *
   * 业务逻辑：
   * 1. 验证商店 slug 对应的商户已审批
   * 2. 检查邮箱在同商户内是否已注册
   * 3. 使用 bcrypt 加密密码（10 轮盐值）
   * 4. 创建消费者记录
   * 5. 签发 JWT 令牌返回
   *
   * @param slug - 商户商店 slug（URL 标识）
   * @param dto - 注册信息，包含 email、password、firstName、lastName
   * @returns 包含 accessToken 和 customer 基本信息的对象
   * @throws ConflictException - 邮箱已被注册
   * @throws NotFoundException - 商店不存在或未审批
   */
  async register(slug: string, dto: StoreRegisterDto) {
    // 解析并验证商户商店（确保已审批）
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 检查邮箱在同商户内是否已被注册
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: dto.email },
      },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 使用 bcrypt 加密密码（10 轮盐值）
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 创建消费者记录
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        password: passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
      },
    });

    // 返回令牌和消费者信息
    return {
      accessToken: this.signStoreToken(customer.id, tenant.id),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  /**
   * 消费者登录
   *
   * 业务逻辑：
   * 1. 验证商店 slug 对应的商户已审批
   * 2. 根据 tenantId + email 查找消费者
   * 3. 使用 bcrypt 验证密码
   * 4. 签发 JWT 令牌返回
   *
   * @param slug - 商户商店 slug（URL 标识）
   * @param dto - 登录信息，包含 email、password
   * @returns 包含 accessToken 和 customer 基本信息的对象
   * @throws UnauthorizedException - 邮箱不存在或密码错误
   * @throws NotFoundException - 商店不存在或未审批
   */
  async login(slug: string, dto: StoreLoginDto) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查找消费者并验证密码
    const customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: dto.email },
      },
    });
    if (!customer || !(await bcrypt.compare(dto.password, customer.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 返回令牌和消费者信息
    return {
      accessToken: this.signStoreToken(customer.id, tenant.id),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }
}
