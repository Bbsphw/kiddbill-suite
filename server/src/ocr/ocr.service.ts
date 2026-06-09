// server/src/ocr/ocr.service.ts

import 'multer';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { OCR_ENGINE } from './ocr.constants';
import { OcrEngine } from './interfaces/ocr-engine.interface';
import { OcrResultDto } from './dto/ocr-response.dto';

@Injectable()
export class OcrService {
  constructor(
    @Inject(OCR_ENGINE)
    private readonly ocrEngine: OcrEngine,
  ) {}

  // ฟังก์ชันรับรูปภาพและแปลงเป็นรายการอาหาร
  async parseReceipt(file: Express.Multer.File): Promise<OcrResultDto> {
    if (!file) throw new BadRequestException('No file uploaded');

    return this.ocrEngine.parseReceipt(file);
  }
}
