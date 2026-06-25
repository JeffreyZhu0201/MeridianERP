import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvService } from '../config/env.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { DistributorJwtStrategy } from './strategies/distributor-jwt.strategy';
import { PlatformJwtStrategy } from './strategies/platform-jwt.strategy';
import { MerchantJwtStrategy } from './strategies/merchant-jwt.strategy';
import { DistributorAuthGuard } from './guards/distributor-auth.guard';
import { OptionalStoreAuthGuard } from './guards/optional-store-auth.guard';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { MerchantAuthGuard } from './guards/merchant-auth.guard';
import { StoreAuthGuard } from './guards/store-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'platform-jwt' }),
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [
    PlatformJwtStrategy,
    MerchantJwtStrategy,
    CustomerJwtStrategy,
    DistributorJwtStrategy,
    PlatformAuthGuard,
    MerchantAuthGuard,
    StoreAuthGuard,
    DistributorAuthGuard,
    OptionalStoreAuthGuard,
  ],
  exports: [
    JwtModule,
    PlatformAuthGuard,
    MerchantAuthGuard,
    StoreAuthGuard,
    DistributorAuthGuard,
    OptionalStoreAuthGuard,
  ],
})
export class AuthModule {}
