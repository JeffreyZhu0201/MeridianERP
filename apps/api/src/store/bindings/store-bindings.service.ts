import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { BindingsService } from '../../bindings/bindings.service';
import { ClaimBindingDto } from '../../bindings/dto/claim-binding.dto';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreBindingsService {
  
  constructor(
    private readonly bindingsService: BindingsService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  
  async claim(slug: string, user: AuthenticatedUser, dto: ClaimBindingDto) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    if (user.tenantId !== tenant.id) {
      throw new ForbiddenException('Store context mismatch');
    }
    return this.bindingsService.claimCustomer(
      tenant.id,
      user.userId,
      dto.token,
    );
  }
}
