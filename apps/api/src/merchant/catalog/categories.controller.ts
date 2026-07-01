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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantCategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/catalog.dto';

/**
 * 商户分类控制器 (MerchantCategoriesController)
 *
 * 提供商品分类管理的 RESTful API：
 * - GET /merchant/categories - 获取分类列表
 * - GET /merchant/categories/:id - 获取分类详情
 * - POST /merchant/categories - 创建分类
 * - PATCH /merchant/categories/:id - 更新分类
 * - DELETE /merchant/categories/:id - 删除分类
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/categories')
@UseGuards(MerchantAuthGuard)
export class MerchantCategoriesController {
  constructor(private readonly categoriesService: MerchantCategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.tenantId!, id);
  }
}
