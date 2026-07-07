import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ProductCopyRequest, ProductCopySuggestion } from '@meridian/shared';
import { AiLlmService } from '../../../ai/llm/ai-llm.service';
import type { ProductCopyContext } from '../../../ai/llm/merchant-ai.types';
import { PrismaService } from '../../../prisma/prisma.service';
import { MerchantProductsService } from '../products.service';

@Injectable()
export class ProductCopyAiService {
  private readonly logger = new Logger(ProductCopyAiService.name);

  constructor(
    private readonly products: MerchantProductsService,
    private readonly prisma: PrismaService,
    private readonly aiLlm: AiLlmService,
  ) {}

  async suggest(
    tenantId: string,
    body: ProductCopyRequest,
  ): Promise<ProductCopySuggestion> {
    const productId = body.productId?.trim();
    const draft = body.draft;

    if (!productId && !draft) {
      throw new BadRequestException('productId or draft required');
    }

    const context = productId
      ? await this.buildProductContext(tenantId, productId)
      : await this.buildDraftContext(tenantId, draft!);

    this.logger.log(
      `Product copy AI tenantId=${tenantId} mode=${productId ? 'product' : 'draft'}`,
    );

    return this.aiLlm.suggestProductCopy(context);
  }

  private async buildProductContext(
    tenantId: string,
    productId: string,
  ): Promise<ProductCopyContext> {
    const product = await this.products.findOne(tenantId, productId);
    const variant = product.variants[0];

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        categoryName: product.category?.name ?? null,
        isPublished: product.isPublished,
      },
      variant: variant
        ? {
            sku: variant.sku,
            price: Number(variant.price),
            masterSkuRetailPrice: variant.masterSku?.retailPrice
              ? Number(variant.masterSku.retailPrice)
              : undefined,
          }
        : undefined,
      isBranchLinked: Boolean(variant?.masterSkuId),
    };
  }

  private async buildDraftContext(
    tenantId: string,
    draft: NonNullable<ProductCopyRequest['draft']>,
  ): Promise<ProductCopyContext> {
    const name = draft.name?.trim();
    const sku = draft.sku?.trim();

    if (!name && !sku) {
      throw new BadRequestException('draft.name or draft.sku required');
    }

    let categoryName: string | undefined;
    if (draft.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: draft.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      categoryName = category.name;
    }

    return {
      draft: {
        name: name || undefined,
        description: draft.description,
        categoryName,
        sku: sku || undefined,
        price: draft.price,
      },
      variant:
        sku || draft.price !== undefined
          ? {
              sku: sku ?? 'DRAFT',
              price: draft.price ?? 0,
            }
          : undefined,
      isBranchLinked: false,
    };
  }
}
