// server/src/storage/storage.module.ts

import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';

@Module({
  controllers: [StorageController],
  providers: [StorageService, S3StorageProvider, LocalStorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
