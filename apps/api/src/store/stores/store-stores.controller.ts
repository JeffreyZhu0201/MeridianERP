import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { StoreStoresService } from './store-stores.service';

@Controller('store/stores')
export class StoreStoresController {
  constructor(private readonly storeStoresService: StoreStoresService) {}

  @Public()
  @Get()
  listPublished() {
    return this.storeStoresService.listPublished();
  }
}
