import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../auth/guards/merchant-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { ClaimBindingDto } from './dto/claim-binding.dto';
import { BindingsService } from './bindings.service';

@Controller('bindings')
export class BindingsController {
  constructor(private readonly bindingsService: BindingsService) {}

  @Public()
  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.bindingsService.verify(token);
  }

  @UseGuards(MerchantAuthGuard)
  @Post('claim')
  @HttpCode(201)
  claimMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClaimBindingDto,
  ) {
    return this.bindingsService.claimMerchant(user.tenantId!, dto);
  }
}
