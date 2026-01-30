// server/src/bill-members/dto/join-bill-member.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const JoinBillSchema = z.object({
  joinCode: z
    .string()
    .length(6, 'Join code must be 6 characters')
    .toUpperCase(),
});

export class JoinBillDto extends createZodDto(JoinBillSchema) {}
