// server/src/storage/providers/local-storage.provider.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '@/storage/interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly configService: ConfigService) {}

  private getBaseUrl(): string {
    return this.configService.get<string>('APP_URL') || 'http://localhost:3002';
  }

  generateUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    void contentType;
    const baseUrl = this.getBaseUrl();
    const uploadUrl = `${baseUrl}/storage/upload/${key}`;
    const fileUrl = `${baseUrl}/storage/file/${key}`;
    return Promise.resolve({ uploadUrl, fileUrl });
  }

  getFileUrl(key: string): Promise<string> {
    const baseUrl = this.getBaseUrl();
    return Promise.resolve(`${baseUrl}/storage/file/${key}`);
  }
}
