// server/src/bill-items/dto/update-bill-item.dto.ts

import { createZodDto } from 'nestjs-zod';
import { CreateBillItemSchema } from './create-bill-item.dto';

// ตัด billId ออก (ห้ามย้ายรายการข้ามบิล) และทำให้ field อื่นเป็น Optional
const UpdateBillItemSchema = CreateBillItemSchema.omit({
  billId: true,
}).partial();

export class UpdateBillItemDto extends createZodDto(UpdateBillItemSchema) {}
