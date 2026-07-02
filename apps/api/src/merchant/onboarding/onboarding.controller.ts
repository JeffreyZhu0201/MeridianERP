import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('merchant/onboarding')
@UseGuards(MerchantAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getProfile(user.tenantId!);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.onboardingService.updateProfile(user.tenantId!, dto);
  }

  @Post('submit')
  @HttpCode(201)
  submit(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.submit(user.tenantId!);
  }
}
