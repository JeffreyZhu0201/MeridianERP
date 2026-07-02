import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CommissionsService } from './commissions.service';
import { CommissionListQueryDto } from './dto/commission-list-query.dto';
import { CommissionSummaryQueryDto } from './dto/commission-summary-query.dto';

@Controller('merchant/commissions')
@UseGuards(MerchantAuthGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionSummaryQueryDto,
  ) {
    return this.commissionsService.summary(user.tenantId!, query);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionListQueryDto,
  ) {
    return this.commissionsService.list(user.tenantId!, query);
  }
}
