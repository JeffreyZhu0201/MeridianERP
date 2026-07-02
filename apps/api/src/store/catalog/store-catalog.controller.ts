import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreCatalogService } from './store-catalog.service';

@Controller('store/:slug/products')
export class StoreCatalogController {
  
  constructor(private readonly catalogService: StoreCatalogService) {}

  
  @Public()
  @Get()
  listProducts(@Param('slug') slug: string) {
    return this.catalogService.listProducts(slug);
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
