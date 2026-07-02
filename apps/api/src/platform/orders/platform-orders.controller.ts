import {
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
import { PlatformOrdersService } from './platform-orders.service';

@Controller('platform/orders')
@UseGuards(PlatformAuthGuard)
export class PlatformOrdersController {
  constructor(private readonly ordersService: PlatformOrdersService) {}

  
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('fulfillmentType') fulfillmentType?: string,
  ) {
    return this.ordersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      fulfillmentType,
    );
  }

  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  
  @Post(':id/ship')
  @HttpCode(200)
  ship(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.ship(id, user.userId);
  }
}
