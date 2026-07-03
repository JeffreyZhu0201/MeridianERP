import { Global, Module } from '@nestjs/common';
import { EnvModule } from '../config/env.module';
import { RecruitInviteCodesService } from './recruit-invite-codes.service';
import { RecruitInviteService } from './recruit-invite.service';

@Global()
@Module({
  imports: [EnvModule],
  providers: [RecruitInviteService, RecruitInviteCodesService],
  exports: [RecruitInviteService, RecruitInviteCodesService],
})
export class RecruitInviteModule {}
