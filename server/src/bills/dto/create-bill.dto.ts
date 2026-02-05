// server/src/bills/dto/create-bill.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBillSchema = z.object({
  title: z.string().min(1, 'Title is required').default('New Bill'),
  note: z.string().optional(),

  // Financial Config (Optional - ถ้าไม่ส่งจะใช้ Default ใน DB)
  vatRate: z.number().min(0).optional(),
  serviceChargeRate: z.number().min(0).optional(),
  isVatIncluded: z.boolean().optional(),
  isServiceChargeIncluded: z.boolean().optional(),
  currency: z.string().length(3).optional().default('THB'),

  promptPayNumber: z.string().optional(),
  promptPayName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

export class CreateBillDto extends createZodDto(CreateBillSchema) {}
