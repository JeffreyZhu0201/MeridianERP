import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MerchantOwnerGuard } from '../../auth/guards/merchant-owner.guard';
import { MerchantPluginsController } from './merchant-plugins.controller';

@Module({
  imports: [AuthModule],
  controllers: [MerchantPluginsController],
  providers: [MerchantOwnerGuard],
})
export class MerchantPluginsModule {}
