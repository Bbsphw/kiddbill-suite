// server/src/splits/dto/assign-split.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignSplitSchema = z.object({
  itemId: z.string().uuid('Invalid Item ID'),

  // Array ของคนที่จะหารจานนี้
  splits: z
    .array(
      z.object({
        memberId: z.string().uuid('Invalid Member ID'),

        // น้ำหนัก: เช่น 1=1ส่วน, 2=2ส่วน (Optional, Default=1)
        weight: z.number().min(0).default(1.0).optional(),

        // ยอดตายตัว: เช่น "คนนี้ออก 100 บาท" (Optional)
        fixedAmount: z.number().min(0).optional(),
      }),
    )
    .min(1, 'Select at least 1 member to split'),
});

export class AssignSplitDto extends createZodDto(AssignSplitSchema) {}
