import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { BindingsModule } from './bindings/bindings.module';
import { CommissionModule } from './commission/commission.module';
import { EnvModule } from './config/env.module';
import { InventoryModule } from './inventory/inventory.module';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentModule } from './payment/payment.module';
import { PlatformModule } from './platform/platform.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecruitInviteModule } from './recruit-invite/recruit-invite.module';
import { QueueModule } from './queue/queue.module';
import { StoreModule } from './store/store.module';
import { DistributorModule } from './distributor/distributor.module';
import { PluginModule } from './plugins/plugin.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    RecruitInviteModule,
    AuthModule,
    QueueModule,
    PaymentModule,
    CommissionModule,
    InventoryModule,
    PluginModule,
    PlatformModule,
    MerchantModule,
    BindingsModule,
    StoreModule,
    DistributorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
