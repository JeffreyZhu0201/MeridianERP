import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BindingsController } from './bindings.controller';
import { BindingsService } from './bindings.service';

@Module({
  imports: [AuthModule],
  controllers: [BindingsController],
  providers: [BindingsService],
})
export class BindingsModule {}
