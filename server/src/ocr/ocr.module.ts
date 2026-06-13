import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { OCR_ENGINE } from './ocr.constants';
import { MockOcrEngine } from './engines/mock-ocr.engine';
import { GeminiOcrEngine } from './engines/gemini-ocr.engine';
import { SlipReaderService } from './slip-reader.service';
import { BullModule } from '@nestjs/bullmq';
import { OcrProcessor } from './ocr.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ocr-queue',
    }),
  ],
  controllers: [OcrController],
  providers: [
    OcrService,
    SlipReaderService,
    {
      provide: OCR_ENGINE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('OCR_PROVIDER') || 'mock';
        if (provider === 'gemini') {
          return new GeminiOcrEngine(configService);
        }
        return new MockOcrEngine();
      },
      inject: [ConfigService],
    },
    OcrProcessor,
  ],
  exports: [OcrService, SlipReaderService],
})
export class OcrModule {}
