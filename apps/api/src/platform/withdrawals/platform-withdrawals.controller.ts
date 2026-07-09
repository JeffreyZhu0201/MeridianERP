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
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getPagination } from '../../common/pagination';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { PlatformWithdrawalsService } from './platform-withdrawals.service';

@Controller('platform/withdrawals')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformWithdrawalsController {
  constructor(private readonly service: PlatformWithdrawalsService) {}

  @Get()
  @PlatformRoles('SUPER_ADMIN', 'FINANCE', 'REVIEWER')
  list(
    @Query('status') status?: WithdrawalRequestStatus,
    @Query('distributorId') distributorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = getPagination(
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      { page: 1, limit: 50 },
    );
    return this.service.list({
      status,
      distributorId,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Post(':id/approve')
  @HttpCode(200)
  @PlatformRoles('SUPER_ADMIN', 'FINANCE')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.approve(id, user.userId);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @PlatformRoles('SUPER_ADMIN', 'FINANCE')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.service.reject(id, user.userId, dto.reason);
  }
}
