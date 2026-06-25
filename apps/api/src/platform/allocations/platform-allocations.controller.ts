import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformAllocationsService } from './platform-allocations.service';

@Controller('platform/allocations')
@UseGuards(PlatformAuthGuard)
export class PlatformAllocationsController {
  constructor(private readonly service: PlatformAllocationsService) {}

  @Get('master-skus')
  listMasterSkus() {
    return this.service.listMasterSkus();
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
    },
  ) {
    return this.service.createMasterSku(dto);
  }

  @Get()
  list(@Query('tenantId') tenantId?: string) {
    return this.service.listAllocations(tenantId);
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
