// server/src/bills/dto/update-bill.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateBillSchema } from './create-bill.dto';

// Update รับทุกอย่างเหมือน Create แต่เป็น Optional หมด
// และเพิ่ม field สถานะและการคำนวณส่วนลด
const UpdateBillSchema = CreateBillSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'OCR_PROCESSING', 'SPLITTING', 'COMPLETED', 'CANCELLED'])
    .optional(),
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).optional(),
});

export class UpdateBillDto extends createZodDto(UpdateBillSchema) {}
