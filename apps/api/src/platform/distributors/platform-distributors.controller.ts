import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformDistributorsService } from './platform-distributors.service';

@Controller('platform/distributors')
@UseGuards(PlatformAuthGuard)
export class PlatformDistributorsController {
  constructor(private readonly service: PlatformDistributorsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @HttpCode(201)
  create(
    @Body()
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      accountId?: string;
      commissionRate: number;
      commissionType?: 'PERCENT' | 'FIXED';
    },
  ) {
    return this.service.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      commissionRate?: number;
      commissionType?: 'PERCENT' | 'FIXED';
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/portal')
  @HttpCode(200)
  enablePortal(
    @Param('id') id: string,
    @Body() dto: { password: string },
  ) {
    return this.service.enablePortal(id, dto.password);
  }

  @Post(':id/invite-code')
  @HttpCode(201)
  createInviteCode(
    @Param('id') id: string,
    @Body() dto: { expiresInDays?: number },
  ) {
    return this.service.createInviteCode(id, dto.expiresInDays);
  }

  @Post(':id/invite-code/:codeId/revoke')
  @HttpCode(200)
  revokeInviteCode(
    @Param('id') id: string,
    @Param('codeId') codeId: string,
  ) {
    return this.service.revokeInviteCode(id, codeId);
  }

  @Get(':id/branches')
  getBranches(@Param('id') id: string) {
    return this.service.getBranches(id);
  }

  @Get(':id/commission-entries')
  getCommissionEntries(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCommissionEntries(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id/funds-summary')
  getFundsSummary(@Param('id') id: string) {
    return this.service.getFundsSummary(id);
  }

  @Get(':id/withdrawals')
  getWithdrawals(@Param('id') id: string) {
    return this.service.getWithdrawals(id);
  }
}
