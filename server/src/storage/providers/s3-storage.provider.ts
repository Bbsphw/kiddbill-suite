// server/src/storage/providers/s3-storage.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '@/storage/interfaces/storage-provider.interface';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3StorageProvider.name);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('AWS_REGION') || 'auto';
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn(
        'S3/R2 storage provider variables are missing in configuration.',
      );
    }

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      // Sign upload URL (expires in 15 minutes = 900 seconds)
      const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
        expiresIn: 900,
      });

      // Sign retrieval URL
      const fileUrl = await this.getFileUrl(key);

      return { uploadUrl, fileUrl };
    } catch (error) {
      this.logger.error(`Error generating upload URL for key ${key}`, error);
      throw error;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Sign file access URL (expires in 15 minutes = 900 seconds)
      return await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 900,
      });
    } catch (error) {
      this.logger.error(
        `Error generating file access URL for key ${key}`,
        error,
      );
      throw error;
    }
  }
}
