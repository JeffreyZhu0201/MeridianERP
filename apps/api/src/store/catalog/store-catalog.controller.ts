import { Controller, Get, Param, Query } from '@nestjs/common';
import { parseStoreCatalogQuery } from '@meridian/shared';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreCatalogService } from './store-catalog.service';

@Controller('store/:slug/products')
export class StoreCatalogController {
  constructor(private readonly catalogService: StoreCatalogService) {}

  @Public()
  @Get('filters')
  listFilters(@Param('slug') slug: string) {
    return this.catalogService.getStoreCatalogFilters(slug);
  }

  @Public()
  @Get()
  listProducts(
    @Param('slug') slug: string,
    @Query('category') category?: string,
    @Query('inStock') inStock?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.catalogService.listProducts(
      slug,
      parseStoreCatalogQuery({ category, inStock, q, sort }),
    );
  }

  @Public()
  @Get(':productSlug')
  getProduct(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
  ) {
    return this.catalogService.getProduct(slug, productSlug);
  }
}
