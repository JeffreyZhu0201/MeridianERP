import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DistributorAuthController } from './distributor-auth.controller';
import { DistributorAuthService } from './distributor-auth.service';

@Module({
  imports: [AuthModule],
  controllers: [DistributorAuthController],
  providers: [DistributorAuthService],
  exports: [DistributorAuthService],
})
export class DistributorAuthModule {}
