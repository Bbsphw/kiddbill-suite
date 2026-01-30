// server/src/bills/dto/update-bill.dto.ts

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateBillSchema } from './create-bill.dto';

// Update รับทุกอย่างเหมือน Create แต่เป็น Optional หมด
// และเพิ่ม field ที่ยอมให้แก้ไขทีหลังได้ เช่น status
const UpdateBillSchema = CreateBillSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'OCR_PROCESSING', 'SPLITTING', 'COMPLETED', 'CANCELLED'])
    .optional(),
  discountAmount: z.number().optional(),
  discountPercent: z.number().optional(),
});

export class UpdateBillDto extends createZodDto(UpdateBillSchema) {}
