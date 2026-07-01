import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import {
  CreatePlatformCrmLeadDto,
  UpdatePlatformCrmLeadDto,
} from './dto/lead.dto';
import { PlatformCrmLeadsService } from './platform-crm-leads.service';

/**
 * 平台 CRM 线索控制器 - 提供线索管理的 API 端点
 *
 * 端点：
 * GET /platform/crm/leads - 查询线索列表
 * GET /platform/crm/leads/:id - 获取线索详情
 * POST /platform/crm/leads - 创建线索
 * PATCH /platform/crm/leads/:id - 更新线索
 * DELETE /platform/crm/leads/:id - 删除线索
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/crm/leads')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmLeadsController {
  constructor(private readonly service: PlatformCrmLeadsService) {}

  /**
   * 查询线索列表
   *
   * @param stage - 可选，按阶段筛选
   * @returns 线索列表
   */
  @Get()
  findAll(@Query('stage') stage?: LeadStage) {
    return this.service.findAll(stage);
  }

  /**
   * 获取线索详情
   *
   * @param id - 线索 ID
   * @returns 线索详情
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * 创建线索
   *
   * @param dto - 线索信息
   * @returns 创建的线索
   */
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformCrmLeadDto) {
    return this.service.create(dto);
  }

  /**
   * 更新线索信息
   *
   * @param id - 线索 ID
   * @param dto - 更新字段
   * @returns 更新后的线索
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmLeadDto) {
    return this.service.update(id, dto);
  }

  /**
   * 删除线索
   *
   * @param id - 线索 ID
   * @returns 删除确认
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
