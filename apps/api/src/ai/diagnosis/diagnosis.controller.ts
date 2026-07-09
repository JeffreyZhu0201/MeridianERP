import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { DiagnosisRequest } from '@meridian/shared';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { pipeAiStream } from '../streaming/ai-sse.helper';
import { DiagnosisService } from './diagnosis.service';

@Controller('platform/ai')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FINANCE')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('diagnosis')
  diagnose(
    @Body() body: DiagnosisRequest,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.diagnosisService.diagnose(body, req.user.userId);
  }

  @Post('diagnosis/stream')
  async diagnoseStream(
    @Body() body: DiagnosisRequest,
    @Req() req: { user: AuthenticatedUser },
    @Res() res: Response,
  ): Promise<void> {
    await pipeAiStream(
      res,
      this.diagnosisService.diagnoseStream(body, req.user.userId),
    );
  }
}
