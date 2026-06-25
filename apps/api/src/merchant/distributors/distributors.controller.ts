import {
  Body,
  Controller,
  Delete,
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
import { BindType } from '@prisma/client';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  CreateDistributorDto,
  GenerateQrDto,
  QrHistoryListQueryDto,
  UpdateDistributorDto,
} from './dto/distributor.dto';
import { EnablePortalDto } from './dto/enable-portal.dto';
import { DistributorPerformanceQueryDto } from './dto/distributor-performance-query.dto';
import { DistributorsService } from './distributors.service';

@Controller('merchant/distributors')
@UseGuards(MerchantAuthGuard)
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.distributorsService.findAll(user.tenantId!);
  }

  @Get(':id/qr')
  listQrHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: QrHistoryListQueryDto,
  ) {
    return this.distributorsService.listQrHistory(user.tenantId!, id, query);
  }

  @Get(':id/qr/:qrId/download')
  @Header('Content-Type', 'image/png')
  async downloadQr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('qrId') qrId: string,
  ) {
    const { buffer, filename } = await this.distributorsService.downloadQrPng(
      user.tenantId!,
      id,
      qrId,
    );
    return new StreamableFile(buffer, {
      type: 'image/png',
      disposition: `attachment; filename="${filename}"`,
    });
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
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.distributorsService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDistributorDto,
  ) {
    return this.distributorsService.create(user.tenantId!, dto);
  }

  @Post(':id/qr')
  @HttpCode(201)
  generateQr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: GenerateQrDto,
  ) {
    return this.distributorsService.generateQr(
      user,
      user.tenantId!,
      id,
      (dto.bindType as BindType) ?? BindType.MERCHANT,
      dto.expiresInDays ?? 7,
    );
  }

  @Post(':id/portal')
  @HttpCode(200)
  enablePortal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EnablePortalDto,
  ) {
    return this.distributorsService.enablePortal(
      user,
      user.tenantId!,
      id,
      dto.password,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDistributorDto,
  ) {
    return this.distributorsService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.distributorsService.remove(user.tenantId!, id);
  }
}
