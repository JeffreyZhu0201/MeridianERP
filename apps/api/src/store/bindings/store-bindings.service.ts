import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { BindingsService } from '../../bindings/bindings.service';
import { ClaimBindingDto } from '../../bindings/dto/claim-binding.dto';
import { StoreAuthService } from '../auth/store-auth.service';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreBindingsService {
  
  constructor(
    private readonly bindingsService: BindingsService,
    private readonly storeTenant: StoreTenantService,
    private readonly storeAuth: StoreAuthService,
  ) {}

  async claim(slug: string, user: AuthenticatedUser, dto: ClaimBindingDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const customerId = await this.storeAuth.resolveCustomerId(user.userId, tenant.id);
    return this.bindingsService.claimCustomer(tenant.id, customerId, dto.token);
  }
}
