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
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import {
  CreatePlatformCrmCompanyDto,
  UpdatePlatformCrmCompanyDto,
} from './dto/company.dto';
import { PlatformCrmCompaniesService } from './platform-crm-companies.service';

/**
 * 平台 CRM 公司控制器 - 提供公司管理的 API 端点
 *
 * 端点：
 * GET /platform/crm/companies - 查询公司列表
 * GET /platform/crm/companies/:id - 获取公司详情
 * POST /platform/crm/companies - 创建公司
 * PATCH /platform/crm/companies/:id - 更新公司
 * DELETE /platform/crm/companies/:id - 删除公司
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/crm/companies')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmCompaniesController {
  constructor(private readonly service: PlatformCrmCompaniesService) {}

  /**
   * 查询公司列表
   *
   * @returns 公司列表
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * 获取公司详情
   *
   * @param id - 公司 ID
   * @returns 公司详情
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * 创建公司
   *
   * @param dto - 公司信息
   * @returns 创建的公司
   */
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformCrmCompanyDto) {
    return this.service.create(dto);
  }

  /**
   * 更新公司信息
   *
   * @param id - 公司 ID
   * @param dto - 更新字段
   * @returns 更新后的公司
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmCompanyDto) {
    return this.service.update(id, dto);
  }

  /**
   * 删除公司
   *
   * @param id - 公司 ID
   * @returns 删除确认
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
