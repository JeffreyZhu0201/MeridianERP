import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BindType } from '@prisma/client';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  CreateDistributorDto,
  GenerateQrDto,
  UpdateDistributorDto,
} from './dto/distributor.dto';
import { DistributorsService } from './distributors.service';

@Controller('merchant/distributors')
@UseGuards(MerchantAuthGuard)
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.distributorsService.findAll(user.tenantId!);
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

  @Post(':id/qr')
  generateQr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: GenerateQrDto,
  ) {
    return this.distributorsService.generateQr(
      user.tenantId!,
      id,
      (dto.bindType as BindType) ?? BindType.MERCHANT,
    );
  }
}
