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
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { CreateLeadDto, UpdateLeadStageDto } from '../dto/lead.dto';
import { LeadsService } from './leads.service';

/**
 * CRM 线索控制器 (LeadsController)
 *
 * 提供线索管理的 RESTful API：
 * - GET /merchant/leads - 获取线索列表
 * - GET /merchant/leads/:id - 获取线索详情
 * - POST /merchant/leads - 创建线索
 * - PATCH /merchant/leads/:id/stage - 更新线索阶段
 * - DELETE /merchant/leads/:id - 删除线索
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/leads')
@UseGuards(MerchantAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.tenantId!, dto);
  }

  @Patch(':id/stage')
  updateStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
  ) {
    return this.leadsService.updateStage(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.remove(user.tenantId!, id);
  }
}
