import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { ExportSettlementDto } from './dto/settlement.dto';
import { PlatformSettlementsService } from './platform-settlements.service';

@Controller('platform/settlements')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FINANCE')
export class PlatformSettlementsController {
  constructor(private readonly settlementsService: PlatformSettlementsService) {}

  
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.settlementsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  
  @Get('ledger')
  findLedger(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.settlementsService.findLedger(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  
  @Post('export')
  @HttpCode(201)
  export(@Body() dto: ExportSettlementDto) {
    return this.settlementsService.exportBatch(dto);
  }
}
