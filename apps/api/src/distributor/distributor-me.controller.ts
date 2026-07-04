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
import { DistributorAuthGuard } from '../auth/guards/distributor-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { DistributorMeService } from './distributor-me.service';

@Controller('distributor/me')
@UseGuards(DistributorAuthGuard)
export class DistributorMeController {
  constructor(private readonly meService: DistributorMeService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getDashboard(user);
  }

  @Get('branches')
  listBranches(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listBranches(user);
  }

  @Get('withdrawals')
  listWithdrawals(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listWithdrawals(user);
  }

  @Post('withdrawals')
  @HttpCode(201)
  createWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.meService.createWithdrawal(user, dto.amount, dto.note);
  }

  @Get('commissions')
  listCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionListQueryDto,
  ) {
    return this.meService.listCommissions(user, query);
  }

  @Get('invite-codes')
  listInviteCodes(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listInviteCodes(user);
  }

  @Post('invite-codes')
  @HttpCode(201)
  createInviteCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInviteCodeDto,
  ) {
    return this.meService.createInviteCode(user, dto.expiresInDays);
  }

  @Post('invite-codes/:codeId/revoke')
  @HttpCode(200)
  revokeInviteCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('codeId') codeId: string,
  ) {
    return this.meService.revokeInviteCode(user, codeId);
  }
}
