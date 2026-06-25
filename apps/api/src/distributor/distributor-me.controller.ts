import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DistributorAuthGuard } from '../auth/guards/distributor-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { DistributorMeService } from './distributor-me.service';

@Controller('distributor/me')
@UseGuards(DistributorAuthGuard)
export class DistributorMeController {
  constructor(private readonly meService: DistributorMeService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getDashboard(user);
  }

  @Get('commissions')
  listCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionListQueryDto,
  ) {
    return this.meService.listCommissions(user, query);
  }

  @Get('bindings')
  listBindings(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listBindings(user);
  }
}
