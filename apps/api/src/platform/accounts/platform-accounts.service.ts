import { ConflictException, Injectable } from '@nestjs/common';
import { MerchantRole, PlatformAccount } from '@prisma/client';
import type { UserIdentity } from '@meridian/shared';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePlatformAccountInput {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

@Injectable()
export class PlatformAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<PlatformAccount | null> {
    return this.prisma.platformAccount.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<PlatformAccount | null> {
    return this.prisma.platformAccount.findUnique({ where: { id } });
  }

  async createAccount(input: CreatePlatformAccountInput): Promise<PlatformAccount> {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.platformAccount.create({
      data: {
        email,
        password: passwordHash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
      },
    });
  }

  async verifyPassword(account: PlatformAccount, password: string): Promise<boolean> {
    return bcrypt.compare(password, account.password);
  }

  async ensureCustomer(
    accountId: string,
    tenantId: string,
    profile?: { email?: string; firstName?: string | null; lastName?: string | null },
  ) {
    const account = await this.findById(accountId);
    if (!account) {
      return null;
    }
    const email = (profile?.email ?? account.email).toLowerCase();
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (existing) {
      if (existing.accountId !== accountId) {
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: { accountId },
        });
      }
      return existing;
    }
    return this.prisma.customer.create({
      data: {
        tenantId,
        accountId,
        email,
        firstName: profile?.firstName ?? account.firstName,
        lastName: profile?.lastName ?? account.lastName,
      },
    });
  }

  async hasMerchantOwnerRole(accountId: string): Promise<boolean> {
    const owner = await this.prisma.user.findFirst({
      where: { accountId, role: MerchantRole.MERCHANT_OWNER },
    });
    return owner !== null;
  }

  async computeIdentities(account: PlatformAccount): Promise<UserIdentity[]> {
    const identities: UserIdentity[] = [];
    const [customerCount, merchantUsers, distributor, platformUser] = await Promise.all([
      this.prisma.customer.count({ where: { accountId: account.id } }),
      this.prisma.user.findMany({
        where: { accountId: account.id },
        select: { role: true },
      }),
      account.email
        ? this.prisma.distributor.findFirst({
            where: { email: { equals: account.email, mode: 'insensitive' } },
          })
        : Promise.resolve(null),
      this.prisma.platformUser.findUnique({ where: { email: account.email } }),
    ]);

    if (customerCount > 0) identities.push('CONSUMER');
    if (merchantUsers.some((u) => u.role === MerchantRole.MERCHANT_OWNER)) {
      identities.push('MERCHANT_OWNER');
    }
    if (merchantUsers.some((u) => u.role === MerchantRole.MERCHANT_STAFF)) {
      identities.push('MERCHANT_STAFF');
    }
    if (distributor) identities.push('DISTRIBUTOR');
    if (platformUser) identities.push('PLATFORM_ADMIN');
    return identities;
  }

  toAccountSummary(account: PlatformAccount) {
    return {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      createdAt: account.createdAt.toISOString(),
    };
  }
}
