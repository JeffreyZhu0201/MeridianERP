import { Controller, Get, Param, Query } from '@nestjs/common';
import { parseStoreCatalogQuery } from '@meridian/shared';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreCatalogService } from './store-catalog.service';

@Controller('store/catalog')
export class StoreUnifiedCatalogController {
  constructor(private readonly catalogService: StoreCatalogService) {}

  @Public()
  @Get('filters')
  listFilters(@Query('fulfillment') fulfillment: string) {
    return this.catalogService.getUnifiedCatalogFilters(fulfillment);
  }

  @Public()
  @Get()
  listUnified(
    @Query('fulfillment') fulfillment: string,
    @Query('category') category?: string,
    @Query('inStock') inStock?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.catalogService.listUnifiedCatalog(
      fulfillment,
      parseStoreCatalogQuery({ category, inStock, q, sort }),
    );
  }

  @Public()
  @Get('products/:productSlug')
  getUnifiedProduct(
    @Query('fulfillment') fulfillment: string,
    @Param('productSlug') productSlug: string,
  ) {
    return this.catalogService.getUnifiedProduct(fulfillment, productSlug);
  }
}
