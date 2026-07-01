import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import { MerchantSettingsService } from './merchant-settings.service';

/**
 * 商户团队控制器 (MerchantTeamController)
 *
 * 提供商户团队成员管理 API：
 * - GET /merchant/team - 获取团队成员列表
 * - POST /merchant/team - 创建团队成员（仅业主）
 * - PATCH /merchant/team/:id - 更新团队成员（仅业主）
 * - DELETE /merchant/team/:id - 删除团队成员（仅业主）
 *
 * 额外权限：创建/更新/删除操作需要 MerchantOwnerGuard
 *
 * 限制：
 * - 不能修改自己的账号
 * - 不能删除业主账号
 */
@Controller('merchant/team')
@UseGuards(MerchantAuthGuard)
export class MerchantTeamController {
  constructor(private readonly settingsService: MerchantSettingsService) {}

  @Get()
  listTeam(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.listTeam(user.tenantId!);
  }

  @Post()
  @UseGuards(MerchantOwnerGuard)
  @HttpCode(201)
  createTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.settingsService.createTeamMember(user, dto);
  }

  @Patch(':id')
  @UseGuards(MerchantOwnerGuard)
  updateTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.settingsService.updateTeamMember(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(MerchantOwnerGuard)
  @HttpCode(200)
  removeTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.settingsService.removeTeamMember(user, id);
  }
}
