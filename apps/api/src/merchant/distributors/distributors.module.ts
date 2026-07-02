import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';

@Module({
  imports: [AuthModule],
  controllers: [DistributorsController],
  providers: [DistributorsService],
})
export class DistributorsModule {}
