// server/src/ocr/ocr.module.ts

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { OCR_ENGINE } from './ocr.constants';
import { MockOcrEngine } from './engines/mock-ocr.engine';

@Module({
  controllers: [OcrController],
  providers: [
    OcrService,
    {
      provide: OCR_ENGINE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('OCR_PROVIDER') || 'mock';
        if (provider === 'mock') {
          return new MockOcrEngine();
        }
        // Fallback หรือขยายไปใช้ Provider อื่น เช่น openai, vision ในอนาคต
        return new MockOcrEngine();
      },
      inject: [ConfigService],
    },
  ],
  exports: [OcrService],
})
export class OcrModule {}
