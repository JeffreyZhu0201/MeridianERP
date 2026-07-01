import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EnvService } from '../../config/env.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DistributorLoginDto } from './dto/distributor-login.dto';

/**
 * 渠道经销商认证服务
 *
 * 该服务负责经销商的身份验证逻辑：
 * - 验证经销商登录凭证（邮箱、密码）
 * - 签发 JWT Token
 * - 处理平台级和商户级经销商的区分
 *
 * 认证流程：
 * 1. 根据邮箱查找经销商（支持平台级和商户级）
 * 2. 验证密码
 * 3. 更新最后登录时间
 * 4. 签发包含正确受众（aud: 'distributor'）的 JWT Token
 */
@Injectable()
export class DistributorAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  /**
   * 签发经销商 JWT Token
   *
   * 生成的 Token 包含以下载荷：
   * - sub：经销商 ID
   * - aud：固定为 'distributor'
   * - tenantId：所属租户 ID（平台级经销商为 undefined）
   * - roles：固定为 ['DISTRIBUTOR']
   *
   * Token 使用 JWT_DISTRIBUTOR_SECRET 进行签名。
   *
   * @param distributorId - 经销商 ID
   * @param tenantId - 所属租户 ID（平台级经销商为 null）
   * @returns 签发的 JWT Token 字符串
   */
  private signDistributorToken(distributorId: string, tenantId: string | null) {
    return this.jwt.sign(
      {
        sub: distributorId,
        aud: 'distributor' as const,
        tenantId: tenantId ?? undefined,
        roles: ['DISTRIBUTOR'],
      },
      { secret: this.env.getOrThrow('JWT_DISTRIBUTOR_SECRET') },
    );
  }

  /**
   * 经销商登录
   *
   * 验证经销商提供的凭证并返回 JWT Token。
   *
   * 查询逻辑说明：
   * - 必须满足 portalEnabled=true（门户可用）
   * - 必须满足 isActive=true（账户激活）
   * - 平台级经销商：tenantId=null，通过邮箱直接匹配
   * - 商户级经销商：tenantId!=null，通过 tenantSlug 确定商户
   *
   * 安全考虑：
   * - 密码使用 bcrypt 验证
   * - 登录成功后更新 lastLoginAt 时间戳
   * - 错误信息统一返回 "Invalid credentials" 以防止用户枚举攻击
   *
   * @param dto - 登录表单数据
   * @returns 包含 accessToken 和 distributor 基本信息的对象
   * @throws UnauthorizedException 凭证无效时
   * @throws ForbiddenException 多商户账户需要指定 tenantSlug 时
   */
  async login(dto: DistributorLoginDto) {
    // 根据邮箱查找经销商
    // 如果提供了 tenantSlug，则匹配对应商户下的经销商；否则匹配平台级经销商
    const distributors = await this.prisma.distributor.findMany({
      where: {
        email: dto.email,
        portalEnabled: true,
        isActive: true,
        ...(dto.tenantSlug
          ? { tenant: { slug: dto.tenantSlug } }
          : { tenantId: null }),
      },
      include: { tenant: true },
    });

    // 未找到匹配的经销商
    if (distributors.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 平台级经销商如果邮箱对应多个账户，需要明确指定 tenantSlug
    if (!dto.tenantSlug && distributors.length > 1) {
      throw new ForbiddenException(
        'Multiple merchant accounts found — provide tenantSlug',
      );
    }

    const distributor = distributors[0]!;

    // 检查密码哈希是否存在（防止账户未设置密码）
    if (!distributor.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const valid = await bcrypt.compare(dto.password, distributor.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 更新最后登录时间
    await this.prisma.distributor.update({
      where: { id: distributor.id },
      data: { lastLoginAt: new Date() },
    });

    // 返回 Token 和经销商信息
    return {
      accessToken: this.signDistributorToken(distributor.id, distributor.tenantId),
      distributor: {
        id: distributor.id,
        name: distributor.name,
        email: distributor.email!,
        tenantSlug: distributor.tenant?.slug ?? null,
        isPlatformDistributor: distributor.tenantId === null,
      },
    };
  }
}
