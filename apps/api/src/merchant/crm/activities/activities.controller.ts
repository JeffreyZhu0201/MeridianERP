import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { CreateActivityDto } from '../dto/activity.dto';
import { ActivitiesService } from './activities.service';

/**
 * CRM 活动控制器 (ActivitiesController)
 *
 * 提供活动记录的 RESTful API：
 * - GET /merchant/activities - 获取活动列表
 * - GET /merchant/activities/:id - 获取活动详情
 * - POST /merchant/activities - 创建活动记录
 * - DELETE /merchant/activities/:id - 删除活动记录
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/activities')
@UseGuards(MerchantAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.activitiesService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.activitiesService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.tenantId!, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.activitiesService.remove(user.tenantId!, id);
  }
}
