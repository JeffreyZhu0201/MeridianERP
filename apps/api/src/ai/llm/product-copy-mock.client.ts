import { Injectable } from '@nestjs/common';
import type { ProductCopySuggestion } from '@meridian/shared';
import type { ProductCopyContext } from './merchant-ai.types';

@Injectable()
export class ProductCopyMockClient {
  suggest(context: ProductCopyContext): ProductCopySuggestion {
    const name =
      context.product?.name ??
      context.draft?.name ??
      context.variant?.sku ??
      '商品';
    const category =
      context.product?.categoryName ?? context.draft?.categoryName;
    const price = context.variant?.price ?? context.draft?.price ?? undefined;
    const existingDesc =
      context.product?.description ?? context.draft?.description;

    const title = this.buildTitle(name, category);
    const description = this.buildDescription(
      name,
      category,
      price,
      existingDesc,
      context.isBranchLinked,
    );
    const bulletPoints = this.buildBulletPoints(name, category, price);

    const sources: ProductCopySuggestion['sources'] = [];
    if (context.product) {
      sources.push({
        type: 'product',
        ref: `${context.product.name}${category ? ` / ${category}` : ''}`,
      });
    } else {
      sources.push({ type: 'draft', ref: name });
    }

    return {
      title,
      description,
      bulletPoints,
      tone: '专业亲和',
      sources,
    };
  }

  private buildTitle(name: string, category?: string | null): string {
    const base = name.length <= 40 ? name : name.slice(0, 37) + '…';
    if (category) {
      return `「${base}」— ${category}精选`;
    }
    return `「${base}」— 品质之选`;
  }

  private buildDescription(
    name: string,
    category: string | null | undefined,
    price: number | undefined,
    existingDesc: string | null | undefined,
    isBranchLinked: boolean,
  ): string {
    const parts: string[] = [];

    if (existingDesc?.trim()) {
      parts.push(existingDesc.trim());
    } else {
      parts.push(
        `${name}专为日常选购而设计，${category ? `隶属${category}品类，` : ''}兼顾品质与性价比。`,
      );
    }

    if (price !== undefined) {
      parts.push(`售价 ¥${price.toFixed(2)}，适合门店主推与线上展示。`);
    }

    if (isBranchLinked) {
      parts.push(
        '本商品由总部统一供货，您可根据本地客群调整描述文案，SKU 与供货规格保持不变。',
      );
    } else {
      parts.push('欢迎到店体验或线上下单，我们将为您提供可靠的履约服务。');
    }

    return parts.join('\n\n');
  }

  private buildBulletPoints(
    name: string,
    category: string | null | undefined,
    price: number | undefined,
  ): string[] {
    const points = [
      `${name} — 门店热销推荐`,
      category ? `${category}品类精选` : '品质稳定，适合复购',
    ];
    if (price !== undefined) {
      points.push(`参考售价 ¥${price.toFixed(2)}`);
    }
    return points;
  }
}
