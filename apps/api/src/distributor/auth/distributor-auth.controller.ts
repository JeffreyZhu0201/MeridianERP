import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { DistributorLoginDto } from './dto/distributor-login.dto';
import { DistributorAuthService } from './distributor-auth.service';

@Controller('distributor/auth')
export class DistributorAuthController {
  constructor(private readonly authService: DistributorAuthService) {}

  
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: DistributorLoginDto) {
    return this.authService.login(dto);
  }
}
