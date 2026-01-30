// server/src/bill-items/dto/update-bill-item.dto.ts

import { createZodDto } from 'nestjs-zod';
import { CreateBillItemSchema } from './create-bill-item.dto';

// Omit 'billId' because we shouldn't move an item to another bill
const UpdateBillItemSchema = CreateBillItemSchema.omit({
  billId: true,
}).partial();

export class UpdateBillItemDto extends createZodDto(UpdateBillItemSchema) {}
