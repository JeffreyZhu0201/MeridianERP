import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  CreateProcurementReceivingAddressDto,
  UpdateProcurementReceivingAddressDto,
} from './dto/procurement-address.dto';
import { MerchantProcurementAddressesService } from './merchant-procurement-addresses.service';

@Controller('merchant/settings/procurement-addresses')
@UseGuards(MerchantAuthGuard)
export class MerchantProcurementAddressesController {
  constructor(private readonly service: MerchantProcurementAddressesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.list(user.tenantId!, activeOnly === 'true');
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProcurementReceivingAddressDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProcurementReceivingAddressDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/set-default')
  @HttpCode(200)
  setDefault(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.setDefault(user, id);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
