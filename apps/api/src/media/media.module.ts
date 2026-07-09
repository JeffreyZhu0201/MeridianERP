import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalStorageProvider } from './local-storage.provider';
import {
  MediaFilesController,
  PlatformMediaController,
} from './platform-media.controller';
import { MediaService } from './media.service';
import { S3StorageProvider } from './s3-storage.provider';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlatformMediaController, MediaFilesController],
  providers: [MediaService, LocalStorageProvider, S3StorageProvider],
  exports: [MediaService],
})
export class MediaModule {}
