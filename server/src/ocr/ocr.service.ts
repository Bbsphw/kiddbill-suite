import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { OCR_ENGINE } from './ocr.constants';
import { OcrEngine } from './interfaces/ocr-engine.interface';
import { OcrResultDto } from '@/ocr/dto/ocr-response.dto';

@Injectable()
export class OcrService {
  constructor(
    @Inject(OCR_ENGINE)
    private readonly ocrEngine: OcrEngine,
  ) {}

  // ฟังก์ชันรับรูปภาพและแปลงเป็นรายการอาหาร
  async processReceipt(fileBuffer: Buffer): Promise<OcrResultDto> {
    return await this.ocrEngine.process(fileBuffer);
  }

  async parseReceipt(imageUrl: string): Promise<OcrResultDto> {
    if (!imageUrl) throw new BadRequestException('No image URL provided');

    return this.ocrEngine.parseReceipt(imageUrl);
  }
}
