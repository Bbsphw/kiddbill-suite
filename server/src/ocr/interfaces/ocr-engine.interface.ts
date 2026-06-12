import { OcrResultDto } from '@/ocr/dto/ocr-response.dto';

export interface OcrEngine {
  parseReceipt(imageUrl: string): Promise<OcrResultDto>;
  process(fileBuffer: Buffer): Promise<OcrResultDto>;
}
