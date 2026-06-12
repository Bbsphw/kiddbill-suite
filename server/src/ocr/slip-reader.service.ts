import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GeminiSlipResult {
  amount?: number;
  senderName?: string;
  receiverName?: string;
  date?: string;
  error?: string;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class SlipReaderService {
  private readonly apiKey: string;
  private readonly logger = new Logger(SlipReaderService.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async readSlip(
    base64Data: string,
    mimeType: string = 'image/jpeg',
  ): Promise<GeminiSlipResult> {
    if (!this.apiKey) {
      throw new BadRequestException('GEMINI_API_KEY is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const prompt = `
      คุณคือระบบสแกนสลิปโอนเงิน (Bank Transfer Slip Reader)
      หน้าที่ของคุณคือการอ่านข้อมูลจากภาพสลิปโอนเงินนี้ และดึงข้อมูลออกมาเป็น JSON

      ข้อกำหนด:
      1. ตรวจสอบว่าภาพนี้เป็นสลิปโอนเงินจริงหรือไม่ หากไม่ใช่ให้ใส่ "error": "รูปภาพนี้ไม่ใช่สลิปโอนเงิน"
      2. ดึงจำนวนเงินที่โอน (amount)
      3. ดึงชื่อผู้โอน (senderName)
      4. ดึงชื่อผู้รับโอน (receiverName)
      5. ดึงวันเวลาที่โอน (date)
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                amount: { type: 'NUMBER', description: 'จำนวนเงินที่โอน' },
                senderName: { type: 'STRING', description: 'ชื่อผู้โอน' },
                receiverName: { type: 'STRING', description: 'ชื่อผู้รับโอน' },
                date: {
                  type: 'STRING',
                  description: 'วันที่และเวลาที่โอนเงินในรูปแบบ ISO 8601',
                },
                error: {
                  type: 'STRING',
                  description: 'หากไม่ใช่รูปสลิปให้ใส่เหตุผลที่นี่',
                },
              },
              required: ['amount', 'senderName', 'receiverName'],
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new BadRequestException(
            'ระบบสแกนสลิปเต็มโควตาชั่วคราว กรุณาลองใหม่ในอีกสักครู่',
          );
        }
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const resJson = (await response.json()) as GeminiApiResponse;
      const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error('ไม่ได้รับการตอบสนองจาก Gemini AI');

      const parsedData = JSON.parse(textResponse.trim()) as GeminiSlipResult;

      if (parsedData.error) {
        throw new BadRequestException(parsedData.error);
      }

      return parsedData;
    } catch (error) {
      this.logger.error(
        'Failed to communicate with Gemini API for slip',
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'การสแกนสลิปขัดข้อง ไม่สามารถอ่านข้อมูลรูปภาพได้',
      );
    }
  }
}
