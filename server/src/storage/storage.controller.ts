// server/src/storage/storage.controller.ts

import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { StorageService } from './storage.service';
import { Request, Response } from 'express';
import { join } from 'path';
import { existsSync, createWriteStream, mkdirSync } from 'fs';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-url')
  @UseGuards(ClerkAuthGuard)
  async getUploadUrl(@Body() body: { fileName: string; contentType: string }) {
    const { fileName, contentType } = body;
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }
    return await this.storageService.generateUploadUrl(fileName, contentType);
  }

  @Put('upload/:key')
  async uploadLocalFile(@Param('key') key: string, @Req() req: Request) {
    const provider =
      this.configService.get<string>('STORAGE_PROVIDER') || 'local';
    if (provider !== 'local') {
      throw new ForbiddenException('Local uploads are disabled in production');
    }

    // ป้องกัน Path Traversal
    if (key.includes('..') || key.includes('/') || key.includes('\\')) {
      throw new BadRequestException('Invalid file key');
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, key);
    const writeStream = createWriteStream(filePath);

    req.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ message: 'Upload successful' }));
      writeStream.on('error', (err) =>
        reject(new BadRequestException(err.message)),
      );
    });
  }

  @Get('file/:key')
  getLocalFile(@Param('key') key: string, @Res() res: Response) {
    const provider =
      this.configService.get<string>('STORAGE_PROVIDER') || 'local';
    if (provider !== 'local') {
      throw new ForbiddenException(
        'Local file serving is disabled in production',
      );
    }

    // ป้องกัน Path Traversal
    if (key.includes('..') || key.includes('/') || key.includes('\\')) {
      throw new BadRequestException('Invalid file key');
    }

    const filePath = join(process.cwd(), 'uploads', key);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
