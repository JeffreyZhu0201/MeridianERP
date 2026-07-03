import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreMerchantApplicationDto } from './dto/store-merchant-application.dto';
import { StoreMerchantApplicationService } from './store-merchant-application.service';

@Controller('store/merchant-applications')
export class StoreMerchantApplicationController {
  constructor(private readonly service: StoreMerchantApplicationService) {}

  @Public()
  @Get('invite/:code')
  previewInvite(@Param('code') code: string) {
    return this.service.previewInvite(code);
  }

  @Get('me')
  @UseGuards(StoreAuthGuard)
  getMyApplication(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyApplication(user.userId);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(StoreAuthGuard)
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StoreMerchantApplicationDto,
  ) {
    return this.service.submit(user.userId, dto);
  }
}
