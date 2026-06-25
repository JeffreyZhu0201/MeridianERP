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
import { WithdrawalRequestStatus } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PlatformWithdrawalsService } from './platform-withdrawals.service';

@Controller('platform/withdrawals')
@UseGuards(PlatformAuthGuard)
export class PlatformWithdrawalsController {
  constructor(private readonly service: PlatformWithdrawalsService) {}

  @Get()
  list(@Query('status') status?: WithdrawalRequestStatus) {
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
    @Body() dto: { reason: string },
  ) {
    return this.service.reject(id, user.userId, dto.reason);
  }
}
