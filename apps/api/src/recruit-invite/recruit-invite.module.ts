import { Global, Module } from '@nestjs/common';
import { RecruitInviteService } from './recruit-invite.service';

@Global()
@Module({
  providers: [RecruitInviteService],
  exports: [RecruitInviteService],
})
export class RecruitInviteModule {}
