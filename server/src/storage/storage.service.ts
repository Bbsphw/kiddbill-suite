// server/src/storage/storage.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly provider: StorageProvider;
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Provider: S3StorageProvider,
    private readonly localProvider: LocalStorageProvider,
  ) {
    const providerType =
      this.configService.get<string>('STORAGE_PROVIDER') || 'local';

    if (providerType === 's3') {
      this.provider = this.s3Provider;
      this.logger.log('☁️ Using Cloudflare R2 / S3 storage provider');
    } else {
      this.provider = this.localProvider;
      this.logger.log('💻 Using Local File Storage provider');
    }
  }

  /**
   * Generates a safe file key (UUIDv4) and requests upload and download URLs from the provider.
   */
  async generateUploadUrl(
    originalFileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const fileExtension = extname(originalFileName);
    const key = `${randomUUID()}${fileExtension}`;

    const { uploadUrl, fileUrl } = await this.provider.generateUploadUrl(
      key,
      contentType,
    );

    return { uploadUrl, fileUrl, key };
  }

  /**
   * Returns a retrieval URL for the specified file key.
   */
  async getFileUrl(key: string): Promise<string> {
    return this.provider.getFileUrl(key);
  }
}
