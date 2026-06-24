import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { BindingsModule } from './bindings/bindings.module';
import { CommissionModule } from './commission/commission.module';
import { EnvModule } from './config/env.module';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentModule } from './payment/payment.module';
import { PlatformModule } from './platform/platform.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    AuthModule,
    QueueModule,
    PaymentModule,
    CommissionModule,
    PlatformModule,
    MerchantModule,
    BindingsModule,
    StoreModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
