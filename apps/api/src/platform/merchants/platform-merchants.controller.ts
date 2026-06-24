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
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { PlatformMerchantsService } from './platform-merchants.service';

@Controller('platform/merchants')
@UseGuards(PlatformAuthGuard)
export class PlatformMerchantsController {
  constructor(private readonly platformMerchantsService: PlatformMerchantsService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.platformMerchantsService.list(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.platformMerchantsService.getById(id);
  }

  @Post(':id/approve')
  @HttpCode(201)
  approve(@Param('id') id: string) {
    return this.platformMerchantsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(201)
  reject(@Param('id') id: string, @Body() dto: RejectMerchantDto) {
    return this.platformMerchantsService.reject(id, dto);
  }
}
