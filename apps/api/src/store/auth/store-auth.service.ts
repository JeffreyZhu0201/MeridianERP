import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { StoreCustomerProfile } from '@meridian/shared';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../../config/env.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';

/**
 * @description: 店铺认证服务
 * @return {StoreAuthService}
 * @author {Jeffrey Zhu}
 * @date {2026-07-05 15:29:17}
 * @version {1.0.0}
 * @example
 * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
 */  
@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly storeTenant: StoreTenantService,
    private readonly platformAccounts: PlatformAccountsService,
  ) {}

  /**
   * @description: 签名店铺平台账户令牌
   * @return {string}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
   */  
  private signAccountToken(accountId: string) {
    return this.jwt.sign(
      {
        sub: accountId,
        aud: 'store' as const,
        roles: ['CUSTOMER'],
      },
      { secret: this.env.getOrThrow('JWT_STORE_SECRET') },
    );
  }

  /**
   * @description: 签名店铺客户令牌
   * @return {string}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
   */  
  private signCustomerToken(customerId: string, tenantId: string) {
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
   * @description: 注册店铺平台账户
   * @return {StoreRegisterDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
   */  
  async registerGlobal(dto: StoreRegisterDto) {
    // 创建店铺平台账户
    const account = await this.platformAccounts.createAccount({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    // 返回店铺平台账户令牌和账户摘要
    return {
      accessToken: this.signAccountToken(account.id),
      account: this.platformAccounts.toAccountSummary(account),
    };
  }

  /**
   * @description: 登录店铺平台
   * @return {StoreLoginDto}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
   */
  async loginGlobal(dto: StoreLoginDto) {
    // 查找店铺平台账户
    const account = await this.platformAccounts.findByEmail(dto.email);
    // 如果店铺平台账户不存在，则抛出异常
    if (
      !account ||
      !(await this.platformAccounts.verifyPassword(account, dto.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      accessToken: this.signAccountToken(account.id),
      account: this.platformAccounts.toAccountSummary(account),
    };
  }

  /**
   * @description: 附加店铺平台会话
   * @return {string}
   * @author {Jeffrey Zhu}
   * @date {2026-07-05 15:29:17}
   * @version {1.0.0}
   * @example
   * const service = new StoreAuthService(prisma, jwt, env, storeTenant, platformAccounts);
   */  
  async attachSession(slug: string, accountId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const account = await this.platformAccounts.findById(accountId);
    if (!account) {
      throw new UnauthorizedException('Invalid account');
    }
    // 确保店铺客户存在
    const customer = await this.platformAccounts.ensureCustomer(
      account.id,
      tenant.id,
    );
    // 如果店铺客户不存在，则抛出异常
    if (!customer) {
      throw new UnauthorizedException('Unable to create customer profile');
    }
    return {
      accessToken: this.signCustomerToken(customer.id, tenant.id),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  async register(slug: string, dto: StoreRegisterDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    let account = await this.platformAccounts.findByEmail(dto.email);
    if (account) {
      const valid = await this.platformAccounts.verifyPassword(
        account,
        dto.password,
      );
      if (!valid) {
        throw new ConflictException('Email already registered');
      }
    } else {
      account = await this.platformAccounts.createAccount({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: account.email },
      },
    });
    if (existingCustomer) {
      throw new ConflictException('Email already registered for this store');
    }

    const customer = await this.platformAccounts.ensureCustomer(
      account.id,
      tenant.id,
      {
        email: account.email,
        firstName: dto.firstName ?? account.firstName,
        lastName: dto.lastName ?? account.lastName,
      },
    );
    if (!customer) {
      throw new ConflictException('Unable to create customer profile');
    }

    return {
      accessToken: this.signCustomerToken(customer.id, tenant.id),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
      account: this.platformAccounts.toAccountSummary(account),
    };
  }

  async login(slug: string, dto: StoreLoginDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const account = await this.platformAccounts.findByEmail(dto.email);
    if (
      !account ||
      !(await this.platformAccounts.verifyPassword(account, dto.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const customer = await this.platformAccounts.ensureCustomer(
      account.id,
      tenant.id,
    );
    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      accessToken: this.signCustomerToken(customer.id, tenant.id),
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
      account: this.platformAccounts.toAccountSummary(account),
    };
  }

  async resolveCustomerId(userId: string, tenantId: string): Promise<string> {
    const byCustomer = await this.prisma.customer.findFirst({
      where: { id: userId, tenantId },
    });
    if (byCustomer) {
      return byCustomer.id;
    }

    const byAccount = await this.prisma.customer.findFirst({
      where: { accountId: userId, tenantId },
    });
    if (byAccount) {
      return byAccount.id;
    }

    const account = await this.platformAccounts.findById(userId);
    if (account) {
      const customer = await this.platformAccounts.ensureCustomer(
        account.id,
        tenantId,
      );
      if (customer) {
        return customer.id;
      }
    }

    throw new UnauthorizedException('Invalid store session');
  }

  async getProfile(userId: string): Promise<StoreCustomerProfile> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
    });
    if (customer) {
      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      };
    }

    const account = await this.platformAccounts.findById(userId);
    if (account) {
      return {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
      };
    }

    throw new NotFoundException('Profile not found');
  }
}
