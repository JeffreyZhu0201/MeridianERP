import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { DistributorsService } from './distributors.service';
import { DistributorPerformanceQueryDto } from './dto/distributor-performance-query.dto';

@Controller('merchant/distributors')
@UseGuards(MerchantAuthGuard)
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  private deny() {
    throw new ForbiddenException(
      'Distributor management has moved to platform admin (Phase 5)',
    );
  }

  @Get()
  findAll() {
    return this.deny();
  }

  @Get(':id/qr')
  listQrHistory() {
    return this.deny();
  }

  @Get(':id/qr/:qrId/download')
  @Header('Content-Type', 'image/png')
  downloadQr() {
    return this.deny();
  }

  @Get(':id/performance')
  getPerformance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: DistributorPerformanceQueryDto,
  ) {
    return this.distributorsService.getPerformance(user.tenantId!, id, query);
  }

  @Get(':id')
  findOne() {
    return this.deny();
  }

  @Post()
  @HttpCode(201)
  create() {
    return this.deny();
  }

  @Post(':id/qr')
  @HttpCode(201)
  generateQr() {
    return this.deny();
  }

  @Post(':id/portal')
  @HttpCode(200)
  enablePortal() {
    return this.deny();
  }

  @Patch(':id')
  update() {
    return this.deny();
  }

  @Delete(':id')
  remove() {
    return this.deny();
  }
}
