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
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CreatePlatformMerchantDto } from './dto/create-platform-merchant.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { ListMerchantsQueryDto } from './dto/list-merchants-query.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { PlatformMerchantsService } from './platform-merchants.service';

@Controller('platform/merchants')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformMerchantsController {
  constructor(private readonly platformMerchantsService: PlatformMerchantsService) {}

  @Get()
  @PlatformRoles('SUPER_ADMIN', 'REVIEWER')
  list(@Query() query: ListMerchantsQueryDto) {
    return this.platformMerchantsService.list(query);
  }

  @Post()
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN')
  create(@Body() dto: CreatePlatformMerchantDto) {
    return this.platformMerchantsService.create(dto);
  }

  @Get(':id')
  @PlatformRoles('SUPER_ADMIN', 'REVIEWER')
  getById(@Param('id') id: string) {
    return this.platformMerchantsService.getById(id);
  }

  
  @Post(':id/approve')
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN', 'REVIEWER')
  approve(
    @Param('id') id: string,
    @Body() dto: { recruitedByDistributorId?: string },
  ) {
    return this.platformMerchantsService.approve(id, dto);
  }

  
  @Post(':id/reject')
  @HttpCode(201)
  @PlatformRoles('SUPER_ADMIN')
  reject(@Param('id') id: string, @Body() dto: RejectMerchantDto) {
    return this.platformMerchantsService.reject(id, dto);
  }

  
  @Patch(':id/recruiter')
  @PlatformRoles('SUPER_ADMIN')
  updateRecruiter(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { recruitedByDistributorId: string | null; reason: string },
  ) {
    return this.platformMerchantsService.updateRecruiter(
      id,
      dto,
      user.userId,
    );
  }

  @Patch(':id/store-settings')
  @PlatformRoles('SUPER_ADMIN')
  updateStoreSettings(
    @Param('id') id: string,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.platformMerchantsService.updateStoreSettings(id, dto);
  }
}
