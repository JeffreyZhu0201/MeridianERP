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
  CreatePlatformCrmContactDto,
  UpdatePlatformCrmContactDto,
} from './dto/contact.dto';
import { PlatformCrmContactsService } from './platform-crm-contacts.service';

/**
 * 平台 CRM 联系人控制器 - 提供联系人管理的 API 端点
 *
 * 端点：
 * GET /platform/crm/contacts - 查询联系人列表
 * GET /platform/crm/contacts/:id - 获取联系人详情
 * POST /platform/crm/contacts - 创建联系人
 * PATCH /platform/crm/contacts/:id - 更新联系人
 * DELETE /platform/crm/contacts/:id - 删除联系人
 *
 * 认证：需要 PlatformAuthGuard（平台管理员 JWT）
 */
@Controller('platform/crm/contacts')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmContactsController {
  constructor(private readonly service: PlatformCrmContactsService) {}

  /**
   * 查询联系人列表
   *
   * @returns 联系人列表
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * 获取联系人详情
   *
   * @param id - 联系人 ID
   * @returns 联系人详情
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * 创建联系人
   *
   * @param dto - 联系人信息
   * @returns 创建的联系人
   */
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformCrmContactDto) {
    return this.service.create(dto);
  }

  /**
   * 更新联系人信息
   *
   * @param id - 联系人 ID
   * @param dto - 更新字段
   * @returns 更新后的联系人
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmContactDto) {
    return this.service.update(id, dto);
  }

  /**
   * 删除联系人
   *
   * @param id - 联系人 ID
   * @returns 删除确认
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
