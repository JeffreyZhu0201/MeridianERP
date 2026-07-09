import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { MerchantLoginDto, MerchantRegisterDto } from './dto/merchant-auth.dto';
import { MerchantAuthService } from './merchant-auth.service';

@Controller('merchant/auth')
export class MerchantAuthController {
  constructor(private readonly authService: MerchantAuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: MerchantRegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: MerchantLoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(MerchantAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }
}
