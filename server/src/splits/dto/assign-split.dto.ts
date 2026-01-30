import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignSplitSchema = z.object({
  itemId: z.string().uuid(),
  // เปลี่ยนจาก array ของ string เป็น array ของ object
  splits: z
    .array(
      z.object({
        memberId: z.string().uuid(),
        weight: z.number().min(0.1).default(1.0), // รับค่า Weight (default 1)
      }),
    )
    .min(1, 'Select at least 1 member'),
});

export class AssignSplitDto extends createZodDto(AssignSplitSchema) {}
