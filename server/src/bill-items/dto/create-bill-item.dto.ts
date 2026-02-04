// server/src/bill-items/dto/create-bill-item.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBillItemSchema = z.object({
  billId: z.string().uuid('Invalid Bill ID'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),

  // Optional Fields (ถ้าไม่ส่งมาจะใช้ Default ใน DB)
  type: z.enum(['FOOD', 'BEVERAGE', 'ALCOHOL', 'DISCOUNT', 'OTHER']).optional(),
  applyVat: z.boolean().optional(),
  applyServiceCharge: z.boolean().optional(),
});

export class CreateBillItemDto extends createZodDto(CreateBillItemSchema) {}
