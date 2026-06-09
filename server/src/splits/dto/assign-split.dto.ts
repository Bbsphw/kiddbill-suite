// server/src/splits/dto/assign-split.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignSplitSchema = z.object({
  itemId: z.string().uuid('Invalid Item ID'),

  splits: z
    .array(
      z.object({
        memberId: z.string().uuid('Invalid Member ID'),
        weight: z.number().min(0).optional().default(1.0), // สัดส่วนการหาร (ค่าเริ่มต้นคือ 1 เท่า)
        fixedAmount: z.number().min(0).optional(), // จ่ายราคาคงที่ (เช่น จ่าย 100 บาท)
      }),
    )
    .min(1, 'At least one member must split the item'),
});

export class AssignSplitDto extends createZodDto(AssignSplitSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type AssignSplitDtoType = ZodDto<typeof AssignSplitSchema>;
