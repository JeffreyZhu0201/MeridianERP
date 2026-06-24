import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';
import { StoreAuthService } from './store-auth.service';

@Controller('store/:slug/auth')
export class StoreAuthController {
  constructor(private readonly authService: StoreAuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Param('slug') slug: string, @Body() dto: StoreRegisterDto) {
    return this.authService.register(slug, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Param('slug') slug: string, @Body() dto: StoreLoginDto) {
    return this.authService.login(slug, dto);
  }
}
