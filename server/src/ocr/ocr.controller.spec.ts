// server/src/ocr/ocr.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OCR_ENGINE } from './ocr.constants';

describe('OcrController', () => {
  let controller: OcrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrController],
      providers: [
        OcrService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: OCR_ENGINE,
          useValue: {
            parseReceipt: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OcrController>(OcrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
