import { Global, Module } from '@nestjs/common';
import { PlatformAccountsService } from './platform-accounts.service';

@Global()
@Module({
  providers: [PlatformAccountsService],
  exports: [PlatformAccountsService],
})
export class PlatformAccountsModule {}
