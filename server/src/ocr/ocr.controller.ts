// server/src/ocr/ocr.controller.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('ocr')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('file')) // รับ field ชื่อ 'file'
  async scanReceipt(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }), // รับแค่รูป
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.ocrService.parseReceipt(file);
  }
}
