// server/src/ocr/dto/ocr-response.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OcrResultItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const OcrResultSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  date: z.string().datetime({ message: 'Invalid ISO date' }),
  items: z.array(OcrResultItemSchema).min(1, 'Must have at least one item'),
  subtotal: z.number().min(0),
  vat: z.number().min(0),
  serviceCharge: z.number().min(0),
  total: z.number().min(0),
});

export class OcrResultDto extends createZodDto(OcrResultSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type OcrResultDtoType = ZodDto<typeof OcrResultSchema>;
