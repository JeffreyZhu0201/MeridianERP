import { Controller, Get } from '@nestjs/common';
import { StoreStoresService } from './store-stores.service';

@Controller('store/stores')
export class StoreStoresController {
  
  constructor(private readonly storeStoresService: StoreStoresService) {}

  
  @Get()
  listPublished() {
    return this.storeStoresService.listPublished();
  }
}
