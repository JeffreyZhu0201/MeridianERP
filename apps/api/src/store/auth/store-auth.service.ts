import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../../config/env.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';

@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly storeTenant: StoreTenantService,
    private readonly platformAccounts: PlatformAccountsService,
  ) {}

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

  async registerGlobal(dto: StoreRegisterDto) {
    const account = await this.platformAccounts.createAccount({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return {
      accessToken: this.signAccountToken(account.id),
      account: this.platformAccounts.toAccountSummary(account),
    };
  }

  async loginGlobal(dto: StoreLoginDto) {
    const account = await this.platformAccounts.findByEmail(dto.email);
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

  async attachSession(slug: string, accountId: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const account = await this.platformAccounts.findById(accountId);
    if (!account) {
      throw new UnauthorizedException('Invalid account');
    }
    const customer = await this.platformAccounts.ensureCustomer(
      account.id,
      tenant.id,
    );
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
}
