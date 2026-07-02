import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllocationOrderStatus } from '@prisma/client';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformAllocationsService } from '../../platform/allocations/platform-allocations.service';

@Controller('merchant/allocations')
@UseGuards(MerchantAuthGuard)
export class MerchantAllocationsController {
  constructor(private readonly allocationsService: PlatformAllocationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: AllocationOrderStatus,
  ) {
    return this.allocationsService.listMerchantAllocations(
      user.tenantId!,
      status,
    );
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.allocationsService.confirmAllocation(
      id,
      user.userId,
      user.tenantId!,
    );
  }
}
