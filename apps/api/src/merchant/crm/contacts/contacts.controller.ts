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
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';
import { ContactsService } from './contacts.service';

/**
 * CRM 联系人控制器 (ContactsController)
 *
 * 提供联系人管理的 RESTful API：
 * - GET /merchant/contacts - 获取联系人列表
 * - GET /merchant/contacts/:id - 获取联系人详情
 * - POST /merchant/contacts - 创建联系人
 * - PATCH /merchant/contacts/:id - 更新联系人
 * - DELETE /merchant/contacts/:id - 删除联系人
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/contacts')
@UseGuards(MerchantAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.contactsService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contactsService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contactsService.remove(user.tenantId!, id);
  }
}
