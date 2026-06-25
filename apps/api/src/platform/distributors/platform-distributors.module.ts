import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { EnvModule } from '../../config/env.module';
import { PlatformDistributorsController } from './platform-distributors.controller';
import { PlatformDistributorsService } from './platform-distributors.service';

@Module({
  imports: [AuthModule, EnvModule],
  controllers: [PlatformDistributorsController],
  providers: [PlatformDistributorsService],
  exports: [PlatformDistributorsService],
})
export class PlatformDistributorsModule {}
