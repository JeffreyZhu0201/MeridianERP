import { Module } from '@nestjs/common';
import { FlagshipCatalogController } from './flagship-catalog.controller';
import { FlagshipCatalogService } from './flagship-catalog.service';

@Module({
  controllers: [FlagshipCatalogController],
  providers: [FlagshipCatalogService],
  exports: [FlagshipCatalogService],
})
export class FlagshipCatalogModule {}
