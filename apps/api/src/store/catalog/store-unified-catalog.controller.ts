import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreCatalogService } from './store-catalog.service';

@Controller('store/catalog')
export class StoreUnifiedCatalogController {
  constructor(private readonly catalogService: StoreCatalogService) {}

  @Public()
  @Get()
  listUnified(@Query('fulfillment') fulfillment: string) {
    return this.catalogService.listUnifiedCatalog(fulfillment);
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
