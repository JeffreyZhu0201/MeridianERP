import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { OptionalStoreAuthGuard } from '../../auth/guards/optional-store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { StoreCartService } from './store-cart.service';

@Controller('store/:slug/cart')
@Public() // 允许公开访问
@UseGuards(OptionalStoreAuthGuard) // 可选认证：支持游客和已登录用户
export class StoreCartController {
  constructor(private readonly cartService: StoreCartService) {}

  @Get()
  getCart(
    @Param('slug') slug: string,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.getCart(slug, sessionId, user);
  }

  @Post('items')
  @HttpCode(201)
  addItem(
    @Param('slug') slug: string,
    @Body() dto: AddCartItemDto,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.addItem(slug, dto, sessionId, user);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('slug') slug: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.updateItem(slug, itemId, dto, sessionId, user);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('slug') slug: string,
    @Param('itemId') itemId: string,
    @Headers('x-cart-session') sessionId: string | undefined,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.cartService.removeItem(slug, itemId, sessionId, user);
  }
}
