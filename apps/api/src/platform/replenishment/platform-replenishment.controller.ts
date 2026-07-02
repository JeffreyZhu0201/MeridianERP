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
import { ReplenishmentRequestStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformReplenishmentService } from './platform-replenishment.service';

@Controller('platform/replenishment')
@UseGuards(PlatformAuthGuard)
export class PlatformReplenishmentController {
  constructor(private readonly service: PlatformReplenishmentService) {}

  
  @Get()
  list(@Query('status') status?: ReplenishmentRequestStatus) {
    return this.service.list(status);
  }

  
  @Post(':id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.approve(id, user.userId);
  }

  
  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.service.reject(id, user.userId, body.reason);
  }
}
