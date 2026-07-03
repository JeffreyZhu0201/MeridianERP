import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreLoginDto, StoreRegisterDto } from './dto/store-auth.dto';
import { StoreAuthService } from './store-auth.service';

@Controller('store/auth')
export class StorePlatformAuthController {
  constructor(private readonly authService: StoreAuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: StoreRegisterDto) {
    return this.authService.registerGlobal(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(201)
  login(@Body() dto: StoreLoginDto) {
    return this.authService.loginGlobal(dto);
  }
}

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

  @Post('session')
  @HttpCode(201)
  @UseGuards(StoreAuthGuard)
  attachSession(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.attachSession(slug, user.userId);
  }
}
