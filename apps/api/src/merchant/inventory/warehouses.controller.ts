import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/inventory.dto';
import { MerchantInventoryService } from './merchant-inventory.service';

@Controller('merchant/inventory/warehouses')
@UseGuards(MerchantAuthGuard)
export class MerchantWarehousesController {
  constructor(private readonly inventoryService: MerchantInventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.listWarehouses(user.tenantId!);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.getWarehouse(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.inventoryService.updateWarehouse(user, id, dto);
  }

  @Post(':id/set-default')
  @HttpCode(200)
  setDefault(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.setDefaultWarehouse(user, id);
  }
}
