import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ClaimBindingDto } from '../../bindings/dto/claim-binding.dto';
import { StoreBindingsService } from './store-bindings.service';

@Controller('store/:slug/bindings')
@UseGuards(StoreAuthGuard)  // 需要已登录的消费者
export class StoreBindingsController {
  
  constructor(private readonly storeBindingsService: StoreBindingsService) {}

  
  @Post('claim')
  async claim(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClaimBindingDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.storeBindingsService.claim(slug, user, dto);
    res.status(result.isExisting ? 200 : 201);
    const { isExisting: _, ...body } = result;
    return body;
  }
}
