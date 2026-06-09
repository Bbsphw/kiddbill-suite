// server/src/ocr/ocr.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from './ocr.service';
import { OCR_ENGINE } from './ocr.constants';

describe('OcrService', () => {
  let service: OcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        {
          provide: OCR_ENGINE,
          useValue: {
            parseReceipt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
