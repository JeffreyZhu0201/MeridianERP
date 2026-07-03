import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { EnvModule } from '../../config/env.module';
import { PlatformAccountsModule } from '../accounts/platform-accounts.module';
import { PlatformDistributorsController } from './platform-distributors.controller';
import { PlatformDistributorsService } from './platform-distributors.service';

@Module({
  imports: [AuthModule, EnvModule, PlatformAccountsModule],
  controllers: [PlatformDistributorsController],
  providers: [PlatformDistributorsService],
  exports: [PlatformDistributorsService],
})
export class PlatformDistributorsModule {}
