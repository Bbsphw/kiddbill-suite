import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { OcrRateLimitGuard } from '@/common/guards/rate-limit.guard';
import { OcrResultDto } from './dto/ocr-response.dto';

@ApiTags('OCR')
@ApiBearerAuth()
@Controller('ocr')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('scan')
  @UseGuards(OcrRateLimitGuard) // 🛡️ จำกัดการกดสแกนรูปภาพ 5 ครั้ง/ชม.
  @ApiOperation({ summary: 'Scan a receipt image to extract items' })
  async scanReceipt(@Body() body: { imageUrl: string }): Promise<OcrResultDto> {
    const { imageUrl } = body;
    return this.ocrService.parseReceipt(imageUrl);
  }
}
