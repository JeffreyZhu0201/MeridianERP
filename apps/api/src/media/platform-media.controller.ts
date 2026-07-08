import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { EnvService } from '../config/env.service';
import { MediaService } from './media.service';

@Controller('platform/media')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN', 'FULFILLMENT')
export class PlatformMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadImage(file, user.userId);
  }
}

@Controller('media/files')
export class MediaFilesController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly env: EnvService,
  ) {}

  @Get('*path')
  serveFile(@Param('path') filePath: string | string[], @Res() res: Response) {
    const mode = this.env.get('MEDIA_STORAGE', 'local');
    if (mode !== 'local') {
      throw new NotFoundException('Local file serving disabled');
    }
    const key = Array.isArray(filePath) ? filePath.join('/') : filePath;
    const base = this.env.get('MEDIA_LOCAL_PATH', './uploads');
    const absolute = path.join(base, key);
    if (!existsSync(absolute)) {
      throw new NotFoundException('File not found');
    }
    res.setHeader('Content-Type', this.mediaService.resolveMimeFromKey(key));
    createReadStream(absolute).pipe(res);
  }
}
