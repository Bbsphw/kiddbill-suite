// server/src/bill-items/dto/create-bill-item.dto.ts

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateBillItemSchema = z.object({
  billId: z.string().uuid('Invalid Bill ID format'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export class CreateBillItemDto extends createZodDto(CreateBillItemSchema) {}
