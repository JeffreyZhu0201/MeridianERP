import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllocationOrderStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformAllocationsService } from './platform-allocations.service';

@Controller('platform/allocations')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
export class PlatformAllocationsController {
  constructor(private readonly service: PlatformAllocationsService) {}

  @Get('master-skus')
  listMasterSkus(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listMasterSkus(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Post('master-skus')
  @HttpCode(201)
  createMasterSku(
    @Body()
    dto: {
      skuCode: string;
      name: string;
      quantityOnHand?: number;
      unitCost: number;
      wholesalePrice: number;
      retailPrice: number;
      flagshipPrice: number;
    },
  ) {
    return this.service.createMasterSku(dto);
  }

  @Patch('master-skus/:id')
  updateMasterSku(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      quantityOnHand?: number;
      unitCost?: number;
      wholesalePrice?: number;
      retailPrice?: number;
      flagshipPrice?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.updateMasterSku(id, dto);
  }

  @Get()
  list(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: AllocationOrderStatus,
  ) {
    return this.service.listAllocations(tenantId, status);
  }

  @Post()
  @HttpCode(201)
  create(
    @Body()
    dto: {
      tenantId: string;
      note?: string;
      lines: Array<{ masterSkuId: string; quantity: number }>;
    },
  ) {
    return this.service.createAllocation(dto.tenantId, dto.lines, dto.note);
  }

  @Post(':id/issue')
  @HttpCode(200)
  issue(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.issueAllocation(id, user.userId);
  }
}
