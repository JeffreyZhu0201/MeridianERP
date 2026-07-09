import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { ProductCopyRequest } from '@meridian/shared';
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { pipeAiStream } from '../../../ai/streaming/ai-sse.helper';
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

  @Post('product-copy/stream')
  async productCopyStream(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ProductCopyRequest,
    @Res() res: Response,
  ): Promise<void> {
    await pipeAiStream(
      res,
      this.productCopyAiService.suggestStream(user.tenantId!, body),
    );
  }
}
