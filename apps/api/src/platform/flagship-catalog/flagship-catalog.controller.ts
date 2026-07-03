import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { FlagshipCatalogService } from './flagship-catalog.service';

@Controller('platform/flagship-catalog')
@UseGuards(PlatformAuthGuard)
export class FlagshipCatalogController {
  constructor(private readonly service: FlagshipCatalogService) {}

  @Get()
  list() {
    return this.service.listCatalog();
  }

  @Post('sync')
  @HttpCode(200)
  syncAll() {
    return this.service.syncAllActive();
  }
}
