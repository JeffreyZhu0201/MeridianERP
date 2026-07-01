import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { OnboardingService } from './onboarding.service';

/**
 * 商户入驻控制器 (OnboardingController)
 *
 * 处理商户入驻相关的 HTTP 请求：
 * - GET /merchant/onboarding - 获取入驻资料
 * - PATCH /merchant/onboarding - 更新入驻资料
 * - POST /merchant/onboarding/submit - 提交入驻申请
 *
 * 所有接口需要商户认证 (MerchantAuthGuard)
 */
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
