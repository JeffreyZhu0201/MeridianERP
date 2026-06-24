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

@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly storeTenant: StoreTenantService,
  ) {}

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

  async register(slug: string, dto: StoreRegisterDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: dto.email },
      },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        password: passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
      },
    });

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

  async login(slug: string, dto: StoreLoginDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    const customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: dto.email },
      },
    });
    if (!customer || !(await bcrypt.compare(dto.password, customer.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
