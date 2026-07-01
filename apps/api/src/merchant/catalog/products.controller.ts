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
import { CreateProductDto, UpdateProductDto } from './dto/catalog.dto';
import { MerchantProductsService } from './products.service';

/**
 * 商户商品控制器 (MerchantProductsController)
 *
 * 提供商品管理的 RESTful API：
 * - GET /merchant/products - 获取商品列表
 * - GET /merchant/products/:id - 获取商品详情
 * - POST /merchant/products - 创建商品
 * - PATCH /merchant/products/:id - 更新商品
 * - DELETE /merchant/products/:id - 删除商品
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
@Controller('merchant/products')
@UseGuards(MerchantAuthGuard)
export class MerchantProductsController {
  constructor(private readonly productsService: MerchantProductsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.remove(user.tenantId!, id);
  }
}
