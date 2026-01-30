// server/src/bills/dto/create-bill.dto.ts

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema สำหรับ Validate ข้อมูลขาเข้า
export const CreateBillSchema = z.object({
  title: z.string().min(1, 'Title is required').default('New Bill'),
  note: z.string().optional(),

  // Financial Config (Optional - ถ้าไม่ส่งจะใช้ Default ใน DB)
  vatRate: z.number().optional(),
  serviceChargeRate: z.number().optional(),
  isVatIncluded: z.boolean().optional(),
  isServiceChargeIncluded: z.boolean().optional(),
  currency: z.string().length(3).optional().default('THB'),
});

export class CreateBillDto extends createZodDto(CreateBillSchema) {}
