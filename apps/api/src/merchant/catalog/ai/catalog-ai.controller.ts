import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { ProductCopyRequest } from '@meridian/shared';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { ProductCopyAiService } from './product-copy-ai.service';

@Controller('merchant/catalog/ai')
@UseGuards(MerchantAuthGuard)
export class CatalogAiController {
  constructor(private readonly productCopyAiService: ProductCopyAiService) {}

  @Post('product-copy')
  @HttpCode(201)
  productCopy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ProductCopyRequest,
  ) {
    return this.productCopyAiService.suggest(user.tenantId!, body);
  }
}
