import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { PrismaService } from '../prisma/prisma.service';

interface OcrJobData {
  imageUrl: string;
  billId?: string;
}

@Processor('ocr-queue')
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<OcrJobData>, error: Error) {
    this.logger.error(
      `OCR job ${job.id} definitively failed after retries: ${error.message}`,
    );
    const billId = job.data?.billId;
    if (billId) {
      try {
        await this.prisma.bill.update({
          where: { id: billId },
          data: { status: 'OCR_FAILED' },
        });
        this.logger.log(`Marked bill ${billId} as OCR_FAILED`);
      } catch (err) {
        this.logger.error(`Failed to update bill ${billId} status`, err);
      }
    }
  }

  async process(job: Job<OcrJobData, unknown, string>): Promise<unknown> {
    this.logger.log(
      `Processing OCR job ${job.id} for image URL: ${job.data.imageUrl}`,
    );
    try {
      const result = await this.ocrService.parseReceipt(job.data.imageUrl);
      this.logger.log(`OCR job ${job.id} completed successfully`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`OCR job ${job.id} failed: ${error.message}`);
      }
      throw error;
    }
  }
}
