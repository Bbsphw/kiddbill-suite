// server/src/ocr/interfaces/ocr-engine.interface.ts

import 'multer';
import { OcrResultDto } from '../dto/ocr-response.dto';

export interface OcrEngine {
  parseReceipt(file: Express.Multer.File): Promise<OcrResultDto>;
}
