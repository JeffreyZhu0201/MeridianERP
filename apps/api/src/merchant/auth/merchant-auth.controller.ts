import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
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
}
